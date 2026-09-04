
# AI Studio MVP

Een simpele, echte AI-image webapp met:
- Text to Image
- Image to Image
- Prompt + negative prompt
- Formaatkeuze
- Strength voor image-to-image
- Credits
- Lokale generatiegeschiedenis
- Demo-modus zonder API-key
- fal.ai / FLUX koppeling zodra je `FAL_KEY` instelt

## 1. Installeren

Zorg dat Node.js 20+ is geïnstalleerd.

```bash
npm install
```

## 2. API-key instellen

Kopieer `.env.example` naar `.env`.

```bash
cp .env.example .env
```

Zet daarna je fal.ai key in `.env`:

```env
FAL_KEY=jouw_sleutel_hier
PORT=3000
```

## 3. Starten

```bash
npm start
```

Open daarna:

http://localhost:3000

## Demo-modus

Als `FAL_KEY` leeg is, werkt de volledige interface maar gebruikt de generate-knop een voorbeeldafbeelding. Zo kun je eerst het product testen.

## Wat nog nodig is vóór een publieke lancering

Deze MVP is een technische basis, geen volledige SaaS. Voor een echte publieke lancering voeg je bij voorkeur toe:
- echte accounts / authenticatie;
- database zoals Supabase/Postgres;
- Stripe voor betalingen en credit-pakketten;
- server-side credittransacties per gebruiker;
- rate limiting;
- moderatie en abuse-preventie;
- algemene voorwaarden en privacybeleid;
- cloud storage;
- logging en foutmonitoring;
- image-to-video;
- admin-dashboard.

## Hosting

De app kan bijvoorbeeld als Node.js-service worden gehost. Zet de `FAL_KEY` daar als geheime environment variable en nooit in frontend-code.

## Structuur

- `server.js` – backend + fal.ai API
- `public/index.html` – interface
- `public/style.css` – design
- `public/app.js` – frontend
- `data/state.json` – lokale demo credits/history
