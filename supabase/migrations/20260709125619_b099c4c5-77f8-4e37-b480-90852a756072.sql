UPDATE site_settings
SET value = value || '[
  {
    "id": "businesses",
    "name": "أنشطة للبيع",
    "nameEn": "Businesses for Sale",
    "icon": "🏪",
    "image": "/__l5e/assets-v1/fb407cd7-162a-4db4-91e7-0be93da8d308/cat-businesses.jpg",
    "count": 0,
    "description": "محلات ومشاريع وأنشطة تجارية قائمة للبيع أو التقبيل.",
    "descriptionEn": "Running shops, projects and businesses for sale.",
    "brands": [],
    "groups": [
      {"name": "محلات ومطاعم", "items": []},
      {"name": "مشاريع ناشئة", "items": []},
      {"name": "أخرى", "items": []}
    ]
  },
  {
    "id": "auctions",
    "name": "المزادات",
    "nameEn": "Auctions",
    "icon": "🔨",
    "image": "/__l5e/assets-v1/68f11720-000e-465b-a7c0-faf85264eb18/cat-auctions.jpg",
    "count": 0,
    "description": "مزادات حية على المعدات والمركبات والأثاث وغيرها.",
    "descriptionEn": "Live auctions on equipment, vehicles, furniture and more.",
    "brands": [],
    "groups": [
      {"name": "مزادات عامة", "items": []}
    ]
  }
]'::jsonb
WHERE key = 'categories'
AND NOT (value @> '[{"id":"businesses"}]'::jsonb);