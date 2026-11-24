# VietVoice

Ứng dụng React chuyển văn bản tiếng Việt và tiếng Anh thành giọng nói bằng mô hình chạy trực tiếp trên thiết bị.

## Tính năng

- Không gọi API chuyển văn bản thành giọng nói, không cần API key, backend hoặc voice có sẵn của trình duyệt/OS.
- Văn bản được xử lý trong trình duyệt; chỉ mô hình giọng đọc được tải xuống.
- Tải voice tiếng Việt hoặc tiếng Anh khi dùng lần đầu (khoảng 60 MB mỗi voice), lưu trong IndexedDB và dùng lại ngoại tuyến.
- Service worker lưu bộ giao diện để có thể mở lại ứng dụng khi ngoại tuyến.
- Tùy chỉnh tốc độ và âm lượng; phát, tạm dừng và dừng.
- Hỗ trợ văn bản dài bằng cách chia thành các đoạn để xử lý lần lượt.

> Cần kết nối Internet lần đầu để tải ứng dụng và từng mô hình giọng đọc. Sau đó, chuyển đổi giọng nói chạy cục bộ. Trình duyệt có thể xóa dữ liệu lưu trữ; nếu mô hình bị xóa, cần tải lại. Chất lượng giọng phụ thuộc mô hình đã chọn.

## Chạy tại máy

Yêu cầu Node.js 20 trở lên và npm.

```bash
npm install
npm run dev
```

## Kiểm tra và build

```bash
npm test
npm run build
```

Thư mục build đầu ra là `dist`.

## Deploy lên Vercel

Ứng dụng là static site, không cần API key hay serverless function. Lệnh cài đặt trong `vercel.json` bỏ qua CUDA binaries của ONNX Runtime Node vì ứng dụng chỉ dùng ONNX Runtime Web trong trình duyệt. Có thể deploy qua Vercel CLI:

```bash
npx vercel
npx vercel --prod
```

Hoặc import Git repository trong Vercel Dashboard. Cấu hình trong `vercel.json` dùng build command `npm run build` và thư mục đầu ra `dist`.

## Mô hình và giấy phép

- [Piper TTS Web](https://github.com/Poket-Jony/piper-tts-web) và ONNX Runtime Web chạy suy luận trong trình duyệt.
- Voice tiếng Việt: [vi_VN-vais1000-medium](https://huggingface.co/rhasspy/piper-voices), dữ liệu VAIS-1000, CC BY 4.0.
- Voice tiếng Anh: [en_US-ljspeech-medium](https://huggingface.co/rhasspy/piper-voices), dữ liệu LJSpeech, public domain.
- Các mô hình được tải từ Hugging Face và lưu cục bộ theo từng trình duyệt.

## Bản deploy

- https://viet-voice-three.vercel.app
