#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.sats-x"
LOG_DIR="$RUNTIME_DIR/logs"

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000/health"
LIVENESS_URL="http://localhost:8000/health"

mkdir -p "$LOG_DIR"

info() {
    printf '\033[1;36m[SATS X]\033[0m %s\n' "$*"
}

success() {
    printf '\033[1;32m[SATS X]\033[0m %s\n' "$*"
}

fail() {
    printf '\033[1;31m[SATS X]\033[0m %s\n' "$*" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

is_running() {
    local pid_file="$1"
    local pid

    [[ -f "$pid_file" ]] || return 1
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    [[ "$pid" =~ ^[0-9]+$ ]] || return 1
    kill -0 "$pid" 2>/dev/null
}

start_service() {
    local name="$1"
    local work_dir="$2"
    shift 2

    local pid_file="$RUNTIME_DIR/$name.pid"
    local log_file="$LOG_DIR/$name.log"

    if is_running "$pid_file"; then
        info "$name is already running (PID $(cat "$pid_file"))."
        return 0
    fi

    rm -f "$pid_file"
    info "Starting $name..."

    (
        cd "$work_dir"
        nohup "$@" >"$log_file" 2>&1 &
        printf '%s\n' "$!" >"$pid_file"
    )

    sleep 1
    if ! is_running "$pid_file"; then
        tail -n 30 "$log_file" >&2 || true
        fail "$name failed to start. See $log_file"
    fi
}

wait_for_http() {
    local name="$1"
    local url="$2"
    local attempts="$3"
    local count=1

    while (( count <= attempts )); do
        if curl --silent --fail --max-time 3 "$url" >/dev/null 2>&1; then
            success "$name is ready at $url"
            return 0
        fi
        sleep 1
        ((count += 1))
    done

    printf '\n' >&2
    tail -n 40 "$LOG_DIR/$name.log" >&2 || true
    fail "$name did not become ready at $url"
}

create_local_environment() {
    if [[ ! -f "$ROOT_DIR/backend/.env" ]]; then
        local access_secret refresh_secret service_token
        access_secret="$(openssl rand -hex 48)"
        refresh_secret="$(openssl rand -hex 48)"
        service_token="$(openssl rand -hex 32)"

        (
            umask 077
            cat >"$ROOT_DIR/backend/.env" <<EOF
PORT=4000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
DATABASE_URL="postgresql://postgres:devpw@localhost:15432/attendance_system?schema=public"
JWT_ACCESS_SECRET=$access_secret
JWT_REFRESH_SECRET=$refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7
SERVICE_TOKEN=$service_token
EOF
        )
        success "Created backend/.env with local development secrets."
    fi

    if [[ ! -f "$ROOT_DIR/frontend/.env" ]]; then
        cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env"
        success "Created frontend/.env from the development example."
    fi
}

install_dependencies() {
    if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
        info "Installing frontend dependencies..."
        npm --prefix "$ROOT_DIR/frontend" ci
    fi

    if [[ ! -d "$ROOT_DIR/backend/node_modules" ]]; then
        info "Installing backend dependencies..."
        npm --prefix "$ROOT_DIR/backend" ci
    fi

    if [[ "${SATS_X_SKIP_LIVENESS:-0}" == "1" ]]; then
        return 0
    fi

    local python_command=""
    local candidate
    local desired_version
    local current_version=""

    if [[ -n "${SATS_X_PYTHON:-}" ]]; then
        candidate="$SATS_X_PYTHON"
        command -v "$candidate" >/dev/null 2>&1 || \
            fail "SATS_X_PYTHON does not point to an executable Python interpreter: $candidate"
        if ! "$candidate" -c 'import sys; raise SystemExit(0 if (3, 10) <= sys.version_info[:2] <= (3, 12) else 1)'; then
            fail "TensorFlow requires Python 3.10-3.12; SATS_X_PYTHON is $($candidate --version 2>&1)."
        fi
        python_command="$candidate"
    else
        for candidate in \
            /opt/homebrew/bin/python3.12 \
            /usr/local/bin/python3.12 \
            python3.12 python3.11 python3.10; do
            if command -v "$candidate" >/dev/null 2>&1 && \
                "$candidate" -c 'import sys; raise SystemExit(0 if (3, 10) <= sys.version_info[:2] <= (3, 12) else 1)' \
                    >/dev/null 2>&1; then
                python_command="$candidate"
                break
            fi
        done
    fi

    if [[ -z "$python_command" ]]; then
        fail "TensorFlow does not support the installed Python 3.14 runtime. Install Python 3.12 with 'brew install python@3.12', then run ./start.sh again."
    fi

    desired_version="$("$python_command" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
    if [[ -x "$ROOT_DIR/liveness/.venv/bin/python" ]]; then
        current_version="$("$ROOT_DIR/liveness/.venv/bin/python" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
    fi

    if [[ ! -x "$ROOT_DIR/liveness/.venv/bin/python" || "$current_version" != "$desired_version" ]]; then
        if [[ -d "$ROOT_DIR/liveness/.venv" ]]; then
            info "Rebuilding the liveness environment (Python ${current_version:-unknown} -> $desired_version)..."
            "$python_command" -m venv --clear "$ROOT_DIR/liveness/.venv"
        else
            info "Creating the liveness Python $desired_version environment..."
            "$python_command" -m venv "$ROOT_DIR/liveness/.venv"
        fi
    fi

    current_version="$("$ROOT_DIR/liveness/.venv/bin/python" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
    if [[ "$current_version" != "$desired_version" ]]; then
        fail "The liveness environment was created with Python ${current_version:-unknown}, expected $desired_version. Remove liveness/.venv and try again."
    fi

    if ! "$ROOT_DIR/liveness/.venv/bin/python" -c \
        'import fastapi, uvicorn, tensorflow, cv2, PIL, numpy' >/dev/null 2>&1; then
        info "Installing liveness dependencies. The first installation can take several minutes..."
        "$ROOT_DIR/liveness/.venv/bin/python" -m pip install --upgrade pip
        "$ROOT_DIR/liveness/.venv/bin/python" -m pip install -r "$ROOT_DIR/liveness/requirements.txt"
    fi
}

start_database() {
    if [[ "${SATS_X_SKIP_DATABASE:-0}" == "1" ]]; then
        info "Skipping the local database because SATS_X_SKIP_DATABASE=1."
        return 0
    fi

    require_command docker
    if ! docker info >/dev/null 2>&1; then
        if [[ "$(uname -s)" == "Darwin" ]] && command -v open >/dev/null 2>&1 && \
            open -Ra Docker >/dev/null 2>&1; then
            info "Docker Desktop is not running. Starting it now..."
            open -a Docker

            local docker_attempt=1
            while (( docker_attempt <= 90 )); do
                if docker info >/dev/null 2>&1; then
                    success "Docker Desktop is ready."
                    break
                fi
                sleep 1
                ((docker_attempt += 1))
            done
        fi
    fi

    docker info >/dev/null 2>&1 || \
        fail "Docker is installed but its daemon is unavailable. Start Docker Desktop and try again."

    info "Starting PostgreSQL..."
    docker compose -f "$ROOT_DIR/backend/docker-compose.yml" up -d postgres

    local count=1
    while (( count <= 30 )); do
        if docker compose -f "$ROOT_DIR/backend/docker-compose.yml" exec -T postgres \
            pg_isready -U postgres -d attendance_system >/dev/null 2>&1; then
            success "PostgreSQL is ready on localhost:15432."
            return 0
        fi
        sleep 1
        ((count += 1))
    done

    fail "PostgreSQL did not become healthy within 30 seconds."
}

prepare_database() {
    info "Generating the Prisma client and applying database migrations..."
    (
        cd "$ROOT_DIR/backend"
        npx prisma generate
        npx prisma migrate deploy
    )
}

main() {
    require_command node
    require_command npm
    require_command curl
    require_command openssl

    create_local_environment
    install_dependencies
    start_database
    prepare_database

    start_service backend "$ROOT_DIR/backend" npm run start
    wait_for_http backend "$BACKEND_URL" 45

    start_service frontend "$ROOT_DIR/frontend" npm run dev -- --host 0.0.0.0
    wait_for_http frontend "$FRONTEND_URL" 45

    if [[ "${SATS_X_SKIP_LIVENESS:-0}" != "1" ]]; then
        start_service liveness "$ROOT_DIR/liveness" \
            "$ROOT_DIR/liveness/.venv/bin/python" -m uvicorn app.main:app \
            --host 0.0.0.0 --port 8000
        wait_for_http liveness "$LIVENESS_URL" 120
    else
        info "Skipping liveness because SATS_X_SKIP_LIVENESS=1."
    fi

    printf '\n'
    success "SATS X is running."
    printf '  Frontend:       %s\n' "$FRONTEND_URL"
    printf '  Backend API:    http://localhost:4000\n'
    printf '  API docs:       http://localhost:4000/api-docs\n'
    if [[ "${SATS_X_SKIP_LIVENESS:-0}" != "1" ]]; then
        printf '  Liveness API:   http://localhost:8000\n'
    fi
    printf '  Logs:           %s\n' "$LOG_DIR"
    printf '\nRun ./stop.sh to stop the local platform.\n'
}

main "$@"
