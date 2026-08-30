# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Instructors are the primary SATS X users. They sign in to review today’s attendance, manage classes, students and subjects, update schedules, and maintain biometric identity records. The backend includes an `admin` role, but role-specific UI remains outside this redesign.

Người xem thứ hai, không tương tác trực tiếp: hội đồng chấm đồ án NCKH xem qua demo trực tiếp hoặc ảnh chụp màn hình. Giao diện phải tự nói lên được đây là sản phẩm nghiêm túc, không cần người trình bày giải thích thêm.

## Product Purpose

Hệ thống điểm danh sinh viên tự động bằng nhận diện khuôn mặt, tích hợp phần cứng ESP32-CAM. Sinh viên đứng trước camera, thiết bị chụp ảnh, gửi qua WebSocket tới AWS Lambda, Lambda so khớp với AWS Rekognition (theo collection riêng của từng lớp) và ghi nhận điểm danh (đúng giờ / trễ / vắng) mà giáo viên không phải điểm danh thủ công. Giao diện web là nơi giáo viên thiết lập dữ liệu (lớp, môn, sinh viên, khuôn mặt, thời khoá biểu) và xem lại kết quả.

Thành công = giáo viên tin tưởng số liệu điểm danh hiển thị đúng, tìm thấy thông tin cần trong vài giây, và không phải đoán trạng thái hệ thống (thiết bị có kết nối không, ảnh vừa nhận diện đúng ai).

## Positioning

Khác với điểm danh thủ công hoặc quét mã QR (vẫn cần sinh viên chủ động thao tác, có thể điểm danh hộ), hệ thống này dùng nhận diện khuôn mặt qua thiết bị IoT chuyên dụng — sinh viên không cần làm gì, không giả mạo được bằng cách nhờ người khác quét hộ.

## Operating Context

- Giáo viên dùng trên laptop/desktop trong lúc chuẩn bị lớp hoặc xem lại sau giờ học — không phải thao tác giữa giờ dạy.
- Một phiên làm việc gõ nhiều: tạo lớp, thêm hàng chục sinh viên, gán môn học, chụp ảnh khuôn mặt từng người — các form và bảng dữ liệu phải hỗ trợ nhập nhanh, không phải chỉ để chiêm ngưỡng.
- Trạng thái kết nối WebSocket (tới thiết bị điểm danh) và trạng thái nhận diện theo thời gian thực là thông tin vận hành quan trọng, hiện đang hiển thị qua toast — cần rõ ràng, không gây xao nhãng.
- Dữ liệu ảnh khuôn mặt là dữ liệu sinh trắc học nhạy cảm — giao diện quản lý phải toát ra sự cẩn trọng (xác nhận trước khi xoá, trạng thái rõ ràng), không phải trải nghiệm mạng xã hội.

## Capabilities and Constraints

- Xác thực: JWT nội bộ (mới chuyển từ AWS Cognito/Amplify), access token 15 phút + refresh token qua cookie httpOnly.
- Dữ liệu: PostgreSQL qua Prisma (mới chuyển từ MySQL), REST API riêng cho CRUD, kênh WebSocket riêng cho luồng thời gian thực (điểm danh + quản lý khuôn mặt).
- Route chính: Dashboard, Classes, Students, Subjects (+ Schedule con), Attendance, Schedule, FaceManagement, Settings, Profile, Login/Home.
- Song ngữ Việt/Anh bắt buộc giữ lại (LanguageContext hiện có).
- Vai trò: chỉ có teacher trong UI hiện tại; admin đã có ở backend nhưng chưa cần phân biệt trên giao diện lần này.
- Ràng buộc kỹ thuật: React 18 + Vite + Tailwind CSS, không đổi stack trong lần thiết kế lại.

## Brand Commitments

SATS X is the product identity. The interface uses an original SX monogram, Outfit typography, and an aurora-teal gradient reserved for brand-bearing surfaces and primary actions.

## Evidence on Hand

- SATS X monogram: rendered as a native UI component with no external logo dependency.
- Hai ảnh nền/asset khác đang dùng cho trang đăng nhập: `bg.png`, `v-aws.png` — không rõ có phải asset chính thức hay chỉ tạm, coi là có thể thay khi thiết kế lại trừ khi giữ được nguyên trạng dễ dàng.
- Không có testimonial, số liệu, hay case study nào cần dùng — đây là hệ thống nội bộ, không phải trang marketing.

## Product Principles

1. Đáng tin cậy hơn ấn tượng — đây là dữ liệu điểm danh và sinh trắc học thật, giao diện phải ưu tiên rõ ràng, chính xác hơn là gây ấn tượng thị giác.
2. Thao tác nhanh trên khối lượng dữ liệu lớn — một lớp có hàng chục sinh viên, một kỳ có hàng nghìn bản ghi điểm danh; bảng, form, tìm kiếm phải hiệu quả, không chỉ đẹp khi có ít dữ liệu mẫu.
3. Trạng thái hệ thống luôn hiện diện, không xâm lấn — kết nối thiết bị, kết quả nhận diện theo thời gian thực là thông tin vận hành, cần thấy được mà không làm rối luồng chính.
4. Nhất quán tuyệt đối giữa các trang — 11 trang dùng chung một hệ thống token, không trang nào "lệch tông" so với các trang còn lại.
5. Nghiêm túc như một sản phẩm production thật, không phải đồ án demo — vì đối tượng xem bao gồm hội đồng chấm.

## Accessibility & Inclusion

Không có yêu cầu đặc thù nào được xác nhận từ người dùng. Áp dụng chuẩn tương phản màu và điều hướng bàn phím thông thường cho một ứng dụng nghiệp vụ (Operate).
