#!/usr/bin/env bash
set -e

echo "🔧 Building Haraj Al Saada web assets..."
bun run build

echo "📱 Syncing Capacitor native projects..."
npx cap sync

echo "🎨 Regenerating app icons and splash screens..."
npx capacitor-assets generate --ios --android

echo "✅ Native projects are ready."
echo "   - iOS:     npx cap open ios"
echo "   - Android: npx cap open android"
