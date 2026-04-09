const express = require('express');
const cors = require('cors');

const app = express();

// Cho phép Frontend gọi API mà không bị lỗi CORS
app.use(cors());
// Hỗ trợ đọc dữ liệu JSON gửi lên
app.use(express.json());

// Điền Affiliate ID của bạn vào đây
const AFFILIATE_ID = '17348000482'; 

app.post('/api/convert', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Vui lòng cung cấp URL' });
        }

        let finalUrl = url;

        // BƯỚC 1: Xử lý redirect nếu là link rút gọn (s.shopee.vn hoặc shope.ee)
        if (url.includes('s.shopee.vn') || url.includes('shope.ee')) {
            // Dùng fetch (tích hợp sẵn trong Node 18+) để gọi thử vào link.
            // Trình duyệt ảo này sẽ tự động chạy theo các chuyển hướng (redirect).
            const response = await fetch(url, { redirect: 'follow' });
            
            // Lấy URL đích cuối cùng sau khi chuyển hướng
            finalUrl = response.url; 
        }

        // BƯỚC 2: Làm sạch URL (Cắt bỏ toàn bộ tham số phía sau dấu ?)
        const cleanUrl = finalUrl.split('?')[0];

        // BƯỚC 3: Ráp thành link Affiliate hoàn chỉnh
        // Lưu ý: Phải dùng encodeURIComponent để mã hóa link gốc an toàn khi nằm trong 1 link khác
        const affiliateLink = `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanUrl)}&share_channel_code=4&affiliate_id=${AFFILIATE_ID}&sub_id=lalalafb----`;

        // Trả kết quả về cho Frontend
        res.json({
            success: true,
            original_link: url,
            clean_link: cleanUrl,
            affiliate_link: affiliateLink
        });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý server' });
    }
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy ổn định tại port ${PORT}`);
});