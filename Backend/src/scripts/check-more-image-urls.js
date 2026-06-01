const fetch = global.fetch || require('node-fetch');

const candidates = [
  ...[1,2,3,4,5,6,7].map(i => `https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-${i}.jpg`),
  ...[1,2,3,4,5,6,7].map(i => `https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-mini-${i}.jpg`),
  ...[1,2,3,4,5,6,7].map(i => `https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-11-pro-max-${i}.jpg`),
  'https://images.samsung.com/is/image/samsung/p6pim/vn/2401/gallery/vn-galaxy-s24-s928-sm-s928bzkhxxv-thumb-539573760?$720_576_PNG$',
  'https://images.samsung.com/is/image/samsung/p6pim/vn/2401/gallery/vn-galaxy-s24-s928-sm-s928bzkhxxv-thumb-539573760?$720_576_PNG$',
  'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s918-sm-s918ezkhmea-thumb-539575371?$720_576_PNG$',
];

const checkUrl = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: e.message };
  }
};

(async () => {
  for (const url of candidates) {
    const r = await checkUrl(url);
    if (r.ok) console.log('OK', r.status, url);
  }
})();
