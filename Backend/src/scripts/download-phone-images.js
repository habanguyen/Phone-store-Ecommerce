const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");

const products = require("../data/sample_products_mongo.json");

// ====== THƯ MỤC LƯU ẢNH ======
const OUTPUT_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ====== DANH SÁCH LINK ẢNH MẪU (có thể ghi đè bằng image_urls.json) ======
let imageMap = {
    "Samsung Galaxy S24 Ultra": [
        "https://placehold.co/800x800.jpg?text=Samsung+Galaxy+S24+Ultra"
    ],
    "Apple iPhone 15 Pro Max": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+15+Pro+Max"
    ],
    "Xiaomi Redmi Note 13 Pro": [
        "https://placehold.co/800x800.jpg?text=Xiaomi+Redmi+Note+13+Pro"
    ],
    "Vivo X90 Pro": [
        "https://placehold.co/800x800.jpg?text=Vivo+X90+Pro"
    ],
    "OPPO Find X7": [
        "https://placehold.co/800x800.jpg?text=OPPO+Find+X7"
    ],
    "Apple iPhone 16 Plus": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+16+Plus"
    ],
    "Apple iPhone 13 mini": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+13+mini"
    ],
    "Apple iPhone 11 Pro Max": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+11+Pro+Max"
    ],
    "Apple iPhone SE (2022)": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+SE+2022"
    ],
    "Apple iPhone 15": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+15"
    ],
    "Apple iPhone 14 Pro Max": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+14+Pro+Max"
    ],
    "Apple iPhone 13": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+13"
    ],
    "Apple iPhone 12 Pro Max": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+12+Pro+Max"
    ],
    "Apple iPhone XS Max": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+XS+Max"
    ],
    "Apple iPhone XR": [
        "https://placehold.co/800x800.jpg?text=Apple+iPhone+XR"
    ]
};

// Nếu tồn tại file `image_urls.json`, load nó và merge/ghi đè
try {
    const urlsFile = path.join(__dirname, 'image_urls.json');
    if (fs.existsSync(urlsFile)) {
        const custom = JSON.parse(fs.readFileSync(urlsFile, 'utf8'));
        imageMap = { ...imageMap, ...custom };
        console.log('Sử dụng mapping ảnh từ', urlsFile);
    }
} catch (e) {
    console.warn('Không thể đọc image_urls.json:', e.message);
}

function getImageUrls(productName) {
    return imageMap[productName] || [
        `https://placehold.co/800x800.jpg?text=${encodeURIComponent(productName)}`
    ];
}

// ====== TẢI ẢNH ======
async function downloadImage(url, filepath) {
    const writer = fs.createWriteStream(filepath);

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

// ====== MAIN ======
async function run() {
    for (const product of products) {

        const urls = getImageUrls(product.name);

            const imagePaths = [product.thumbnail, ...(product.variants?.flatMap((variant) => variant.images || []) || [])].filter(Boolean);

        for (let index = 0; index < imagePaths.length; index++) {
            const imagePath = imagePaths[index];
            const filename = path.basename(imagePath);
            const url = urls[index % urls.length];
            const savePath = path.join(OUTPUT_DIR, filename);

            try {
                console.log(`⬇ Đang tải: ${filename}`);

                await downloadImage(url, savePath);

                console.log(`✅ Đã lưu: ${savePath}`);
            } catch (err) {
                console.log(`❌ Lỗi tải ${filename}`);
                console.log(err.message);
            }
        }
    }

    console.log("\n🎉 HOÀN TẤT TẢI ẢNH");
}

run();