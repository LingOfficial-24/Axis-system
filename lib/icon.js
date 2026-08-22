// app/icon.js
import { ImageResponse } from 'next/og'

// Kích thước mong muốn của icon
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      // CSS để căn giữa ký tự và tô màu
      <div
        style={{
          fontSize: 24,
          background: 'transparent', // Nền trong suốt
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DAA520', // Màu vàng đồng, hoặc màu bất kỳ
        }}
      )
        // Dán ký tự hình sao vào đây
        ✨
      </div>
    ),
    {
      ...size,
    }
  )
}