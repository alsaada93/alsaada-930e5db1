#!/usr/bin/env python3
"""Resumable bilingual SEO article generator for alsaada.sale.

Generates unique, long-form (1500-2500 word) markdown articles via the Lovable
AI Gateway and inserts them directly into public.blog_posts (published=true),
skipping any slug that already exists. Safe to run repeatedly in batches.

Usage: python gen_articles.py --count 20
"""
import os, sys, json, re, time, argparse, subprocess, tempfile, unicodedata
import requests

API_KEY = os.environ["LOVABLE_API_KEY"]
DB_URL = os.environ["SUPABASE_DB_URL"]
GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions"
MODEL = "google/gemini-3-flash-preview"

CATEGORIES = [
    ("Restaurant Equipment", "معدات المطاعم"),
    ("Cafe Equipment", "معدات الكافيهات"),
    ("Bakery Equipment", "معدات المخابز"),
    ("Used Furniture", "أثاث مستعمل"),
    ("Office Furniture", "أثاث المكاتب"),
    ("Refrigerators and Freezers", "ثلاجات ومجمدات"),
    ("Air Conditioners", "مكيفات الهواء"),
    ("Heavy Equipment", "المعدات الثقيلة"),
    ("Cars", "سيارات"),
    ("Real Estate", "العقارات"),
    ("Electronics", "إلكترونيات"),
    ("Smartphones", "الهواتف الذكية"),
    ("Computers and Laptops", "حواسيب ولابتوبات"),
    ("Home Appliances", "الأجهزة المنزلية"),
    ("Construction Materials", "مواد البناء"),
]

CITIES = [
    ("Manama", "المنامة"), ("Muharraq", "المحرق"), ("Riffa", "الرفاع"),
    ("Hamad Town", "مدينة حمد"), ("Isa Town", "مدينة عيسى"), ("Sitra", "سترة"),
    ("Hidd", "الحد"), ("Budaiya", "البديع"), ("Saar", "سار"),
    ("Juffair", "الجفير"), ("Arad", "عراد"), ("Sanabis", "السنابس"), ("A'ali", "عالي"),
]

# Different angles guarantee distinct structure/wording per article.
ANGLES = [
    ("buy", "Buying guide: how to buy {cat} in {city}, Bahrain", "دليل شراء {cat} في {city}، البحرين"),
    ("sell", "Selling guide: how to sell used {cat} fast in {city}, Bahrain", "دليل بيع {cat} المستعملة بسرعة في {city}، البحرين"),
    ("price", "Price guide: {cat} prices and value in {city}, Bahrain", "دليل أسعار {cat} وقيمتها في {city}، البحرين"),
    ("used", "Where to find affordable used {cat} in {city}, Bahrain", "أين تجد {cat} مستعملة بأسعار مناسبة في {city}، البحرين"),
    ("tips", "Expert tips for choosing {cat} in {city}, Bahrain", "نصائح خبراء لاختيار {cat} في {city}، البحرين"),
]


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:120]


def build_queue():
    q = []
    for cat_en, cat_ar in CATEGORIES:
        for city_en, city_ar in CITIES:
            for code, t_en, t_ar in ANGLES:
                for lang in ("en", "ar"):
                    base = f"{code}-{slugify(cat_en)}-{slugify(city_en)}"
                    slug = base if lang == "en" else base + "-ar"
                    q.append({
                        "slug": slug, "lang": lang, "angle": code,
                        "cat_en": cat_en, "cat_ar": cat_ar,
                        "city_en": city_en, "city_ar": city_ar,
                        "title_en": t_en.format(cat=cat_en, city=city_en),
                        "title_ar": t_ar.format(cat=cat_ar, city=city_ar),
                    })
    return q


def existing_slugs():
    out = subprocess.run(
        ["psql", DB_URL, "-tAc", "SELECT slug FROM public.blog_posts"],
        capture_output=True, text=True,
    )
    return set(filter(None, (l.strip() for l in out.stdout.splitlines())))


def prompt_for(item):
    if item["lang"] == "ar":
        return (
            f"اكتب مقالاً فريداً 100% باللغة العربية عن: {item['title_ar']}.\n"
            f"الفئة: {item['cat_ar']} | المدينة: {item['city_ar']} | السوق: alsaada.sale (حراج السعادة) في البحرين.\n\n"
            "المتطلبات:\n"
            "- إلزامي: لا يقل عن 1600 كلمة ولا يزيد عن 2500 كلمة. لا تتوقف مبكراً ووسّع كل قسم.\n"
            "- نظّم المقال في 7 أقسام رئيسية (##) على الأقل، كل قسم 3-5 فقرات (150+ كلمة)، بنبرة خبير موثوق (EEAT) وبدون حشو.\n"
            "- استخدم Markdown: عنوان رئيسي واحد (#)، عدة (##) و(###).\n"
            "- اذكر مدن البحرين بشكل طبيعي (المنامة، المحرق، الرفاع، مدينة حمد...).\n"
            "- كلمات مفتاحية طويلة الذيل وكلمات دلالية (LSI).\n"
            "- أضف قسم 'الأسئلة الشائعة' بصيغة ## يحتوي 6 أسئلة على الأقل، كل سؤال بصيغة ###.\n"
            "- أضف روابط داخلية بصيغة Markdown إلى /add-listing و /search و /tips.\n"
            "- حسّن للمقتطفات المميزة (قوائم وجداول وإجابات مختصرة).\n"
            "- اختم بدعوة لاتخاذ إجراء تشجّع على النشر على alsaada.sale.\n\n"
            "أعد الإخراج بهذا التنسيق الحرفي فقط (بدون أي شيء آخر):\n"
            "TITLE: <العنوان>\n"
            "META_TITLE: <حتى 60 حرف>\n"
            "META_DESCRIPTION: <حتى 160 حرف>\n"
            "EXCERPT: <حتى 200 حرف>\n"
            "KEYWORDS: <كلمات مفصولة بفواصل>\n"
            "CONTENT:\n<المقال كامل بصيغة Markdown>"
        )
    return (
        f"Write a 100% unique English article about: {item['title_en']}.\n"
        f"Category: {item['cat_en']} | City: {item['city_en']} | Marketplace: alsaada.sale (Bahrain).\n\n"
        "Requirements:\n"
        "- MANDATORY: at least 1600 words and at most 2500 words. Do not stop early; expand every section.\n"
        "- Structure into at least 7 H2 sections, each with 3-5 paragraphs (150+ words), expert EEAT tone, no stuffing.\n"
        "- Use Markdown: one H1 (#), multiple H2 (##) and H3 (###).\n"
        "- Mention Bahrain cities naturally (Manama, Muharraq, Riffa, Hamad Town...).\n"
        "- Long-tail keywords and semantic (LSI) keywords.\n"
        "- Include a '## FAQ' section with at least 6 questions, each as ###.\n"
        "- Add internal Markdown links to /add-listing, /search and /tips.\n"
        "- Optimize for featured snippets (lists, tables, concise answers).\n"
        "- End with a call-to-action promoting posting on alsaada.sale.\n\n"
        "Output ONLY in this exact format (nothing else):\n"
        "TITLE: <title>\n"
        "META_TITLE: <<=60 chars>\n"
        "META_DESCRIPTION: <<=160 chars>\n"
        "EXCERPT: <<=200 chars>\n"
        "KEYWORDS: <comma-separated>\n"
        "CONTENT:\n<full Markdown article>"
    )


def generate(item, retries=3):
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a world-class bilingual SEO writer. Output valid JSON only."},
            {"role": "user", "content": prompt_for(item)},
        ],
        "max_tokens": 9000,
    }
    for attempt in range(retries):
        r = requests.post(GATEWAY, headers={
            "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json",
        }, json=body, timeout=180)
        if r.status_code == 429:
            time.sleep(8 * (attempt + 1)); continue
        if r.status_code == 402:
            print("CREDITS_EXHAUSTED"); sys.exit(2)
        r.raise_for_status()
        txt = r.json()["choices"][0]["message"]["content"].strip()
        txt = re.sub(r"^```[a-z]*\s*|\s*```$", "", txt.strip())
        art = parse_fields(txt)
        if art.get("content") and len(art["content"]) > 800:
            return art
        time.sleep(3)
    raise RuntimeError("generation failed")


def parse_fields(txt):
    def grab(label):
        m = re.search(r"(?im)^%s:\s*(.+)$" % label, txt)
        return m.group(1).strip() if m else ""
    cm = re.search(r"(?is)^CONTENT:\s*(.+)$", txt, re.M)
    content = cm.group(1).strip() if cm else txt
    return {
        "title": grab("TITLE"),
        "meta_title": grab("META_TITLE"),
        "meta_description": grab("META_DESCRIPTION"),
        "excerpt": grab("EXCERPT"),
        "keywords": grab("KEYWORDS"),
        "content": content,
    }


def insert(item, art):
    cat = item["cat_ar"] if item["lang"] == "ar" else item["cat_en"]
    payload = {
        "slug": item["slug"],
        "title": (art.get("title") or item["title_ar" if item["lang"] == "ar" else "title_en"])[:300],
        "excerpt": (art.get("excerpt")
                    or re.sub(r"[#*>\\-]"," ",re.sub(r"\\s+"," ",art.get("content") or "")).strip())[:200],
        "content": art.get("content") or "",
        "category": cat[:110],
        "meta_title": (art.get("meta_title") or art.get("title") or "")[:290],
        "meta_description": (art.get("meta_description") or art.get("excerpt")
                             or re.sub(r"[#*>\\-]"," ",re.sub(r"\\s+"," ",art.get("content") or "")).strip())[:155],
        "keywords": (art.get("keywords") if isinstance(art.get("keywords"), str)
                     else ", ".join(art.get("keywords") or []))[:480],
    }
    sql = (
        "INSERT INTO public.blog_posts (slug,title,excerpt,content,category,meta_title,"
        "meta_description,keywords,published,published_at) VALUES ($q$%s$q$,$q$%s$q$,$q$%s$q$,"
        "$q$%s$q$,$q$%s$q$,$q$%s$q$,$q$%s$q$,$q$%s$q$,true,now()) "
        "ON CONFLICT (slug) DO NOTHING;" % (
            payload["slug"], payload["title"].replace("$q$", ""),
            payload["excerpt"].replace("$q$", ""), payload["content"].replace("$q$", ""),
            payload["category"].replace("$q$", ""), payload["meta_title"].replace("$q$", ""),
            payload["meta_description"].replace("$q$", ""), payload["keywords"].replace("$q$", ""),
        )
    )
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False) as f:
        f.write(sql); path = f.name
    res = subprocess.run(["psql", DB_URL, "-f", path], capture_output=True, text=True)
    os.unlink(path)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=20)
    args = ap.parse_args()

    queue = build_queue()
    have = existing_slugs()
    todo = [q for q in queue if q["slug"] not in have][: args.count]
    print(f"queue={len(queue)} existing={len(have)} generating={len(todo)}")

    done = 0
    for item in todo:
        try:
            art = generate(item)
            insert(item, art)
            done += 1
            print(f"[{done}/{len(todo)}] {item['lang']} {item['slug']}")
        except SystemExit:
            raise
        except Exception as e:
            print(f"SKIP {item['slug']}: {e}")
        time.sleep(0.5)
    print(f"DONE generated={done} total_now={len(have)+done}")


if __name__ == "__main__":
    main()
