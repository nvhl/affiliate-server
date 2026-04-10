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

        // Tập hợp tất cả các domain rút gọn phổ biến của Shopee
        const shortDomains = ['s.shopee.vn', 'shope.ee', 'vn.shp.ee', 'shp.ee'];
        
        // Kiểm tra xem url đầu vào có chứa domain rút gọn nào không
        const isShortLink = shortDomains.some(domain => url.includes(domain));

        // BƯỚC 1: Xử lý redirect nếu là link rút gọn
        if (isShortLink) {
            try {
                const response = await fetch(url, { redirect: 'follow' });
                finalUrl = response.url; 
            } catch (fetchError) {
                console.error("Lỗi khi giải mã link rút gọn:", fetchError);
                return res.status(400).json({ error: 'Không thể giải mã link Shopee này. Link có thể đã hỏng.' });
            }
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
