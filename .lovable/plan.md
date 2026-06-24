## Plan: Move Seller Reviews below WhatsApp/Call buttons

### Current situation
- The contact buttons (WhatsApp, Call, Offer) are rendered around lines 752-794 in `src/routes/listing.$id.tsx`.
- The `SellerReviews` component is rendered far below at lines 902-905, after the map and hashtags.
- This makes the review form hard to find; the user wants it placed directly below the contact buttons.

### Changes required
1. **Remove** the `<SellerReviews>` block from its current location at lines 902-905.
2. **Insert** the same `<SellerReviews>` block immediately after the contact buttons `</div>` (after line 794).

### No other changes needed
- The `SellerReviews` component itself stays the same.
- No backend, schema, or dependency changes.
- No data flow changes.
