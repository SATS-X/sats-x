#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.sats-x"
KEEP_DATABASE=0

if [[ "${1:-}" == "--keep-database" ]]; then
    KEEP_DATABASE=1
elif [[ -n "${1:-}" ]]; then
    printf 'Usage: %s [--keep-database]\n' "$0" >&2
    exit 2
fi

info() {
    printf '\033[1;36m[SATS X]\033[0m %s\n' "$*"
}

success() {
    printf '\033[1;32m[SATS X]\033[0m %s\n' "$*"
}

stop_service() {
    local name="$1"
    local pid_file="$RUNTIME_DIR/$name.pid"
    local pid
    local count=1

    if [[ ! -f "$pid_file" ]]; then
        info "$name is not managed by this workspace."
        return 0
    fi

    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! kill -0 "$pid" 2>/dev/null; then
        info "$name is already stopped."
        rm -f "$pid_file"
        return 0
    fi

    info "Stopping $name (PID $pid)..."

    # npm and Uvicorn may own a direct child process. Signal children first,
    # then their parent, so no development server remains orphaned.
    if command -v pgrep >/dev/null 2>&1; then
        local child_pids
        child_pids="$(pgrep -P "$pid" 2>/dev/null || true)"
        if [[ -n "$child_pids" ]]; then
            kill -TERM $child_pids 2>/dev/null || true
        fi
    fi
    kill -TERM "$pid" 2>/dev/null || true

    while (( count <= 10 )); do
        if ! kill -0 "$pid" 2>/dev/null; then
            rm -f "$pid_file"
            success "$name stopped."
            return 0
        fi
        sleep 1
        ((count += 1))
    done

    kill -KILL "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    success "$name was force-stopped after the graceful timeout."
}

main() {
    stop_service liveness
    stop_service frontend
    stop_service backend

    if (( KEEP_DATABASE == 1 )); then
        info "Keeping PostgreSQL running."
    elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        info "Stopping PostgreSQL..."
        docker compose -f "$ROOT_DIR/backend/docker-compose.yml" down
        success "PostgreSQL stopped. The database volume was preserved."
    else
        info "Docker is unavailable; PostgreSQL was not managed."
    fi

    success "SATS X is stopped."
}

main "$@"
