const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

const app = express();

// Cho phép Frontend gọi API mà không bị lỗi CORS
app.use(cors());
// Hỗ trợ đọc dữ liệu JSON gửi lên
app.use(express.json());

// --- BẢO VỆ 1: GIỚI HẠN LUỒNG (RATE LIMITING) ---
// Chống spam: Giới hạn mỗi IP chỉ được gọi API tối đa 30 lần trong 1 phút
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 30, // Tối đa 30 request
    message: { error: 'Bạn thao tác quá nhanh, hệ thống bị nghẽn. Vui lòng đợi 1 phút rồi thử lại.' }
});
app.use('/api/', limiter);

// --- BẢO VỆ 2: BỘ NHỚ ĐỆM (CACHING) ---
// Lưu kết quả đã chuyển đổi thành công trong 2 giờ (7200 giây) để tái sử dụng
const myCache = new NodeCache({ stdTTL: 7200 });

// Điền Affiliate ID của bạn
const AFFILIATE_ID = '17348000482'; 

app.post('/api/convert', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Vui lòng cung cấp URL' });
        }

        // KIỂM TRA CACHE: Nếu link này đã có người tạo gần đây, lấy kết quả trả về luôn (siêu tốc)
        const cachedResult = myCache.get(url);
        if (cachedResult) {
            return res.json({
                success: true,
                original_link: url,
                clean_link: cachedResult.clean_link,
                affiliate_link: cachedResult.affiliate_link,
                from_cache: true
            });
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
        const affiliateLink = `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(cleanUrl)}&share_channel_code=4&affiliate_id=${AFFILIATE_ID}&sub_id=lalalafb----`;

        // LƯU VÀO CACHE CHO LẦN SAU
        myCache.set(url, {
            clean_link: cleanUrl,
            affiliate_link: affiliateLink
        });

        // Trả kết quả về cho Frontend
        res.json({
            success: true,
            original_link: url,
            clean_link: cleanUrl,
            affiliate_link: affiliateLink,
            from_cache: false
        });

    } catch (error) {
        console.error("Lỗi server:", error);
        res.status(500).json({ error: 'Đã xảy ra lỗi trong quá trình xử lý server' });
    }
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy ổn định tại port ${PORT}`);
});
