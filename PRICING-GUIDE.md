# Pricing Configuration Guide

This guide explains how to easily update prices across the entire Hansen Mobile Detailing website.

## Quick Price Updates

All pricing is now centralized in the `pricing-config.js` file. To update any price:

1. Open `pricing-config.js`
2. Find the service or add-on you want to update
3. Change the price value
4. Save the file
5. Refresh the website - prices will update automatically!

## Main Service Prices

Edit these values in the `services` object:

```javascript
services: {
    'premium-exterior': 50,     // Premium Exterior Detail
    'interior-detail': 150,     // Interior Detail
    'sedan-full': 200,          // Sedan Full Detail
    'mid-size-suv-full': 225,   // Mid-Size SUV Full Detail
    'truck-full': 250,          // Truck Full Detail
    'suv-full': 275,            // SUV Full Detail
    'custom': 200,              // Custom Package (default estimate)
    'quote': 0                  // Custom Quote (no preset price)
}
```

## Add-on Service Prices

Edit these values in the `addons` object:

```javascript
addons: {
    'ceramic-coat': 25,           // Ceramic Coat Sealant
    'clay-bar': 50,               // Clay Bar
    'headlight-restoration': 50,   // Headlight Restoration
    'carpet-shampoo': 50,         // Full Carpet Shampoo
    'seat-shampoo': 50,           // Full Seat Shampoo
    'pet-hair-removal': 50,       // Excessive Pet Hair Removal
    'stain-removal': 50           // Excessive Stain Removal
}
```

## What Gets Updated Automatically

When you change prices in `pricing-config.js`, the following will update automatically:

- ✅ Service cards on the main website
- ✅ Booking form price calculator
- ✅ Add-on service pricing in booking form
- ✅ Admin panel revenue calculations
- ✅ Admin panel booking value estimates

## Example: Changing Premium Exterior to $75

1. Open `pricing-config.js`
2. Find: `'premium-exterior': 50,`
3. Change to: `'premium-exterior': 75,`
4. Save the file
5. Refresh the website

The price will now show as $75 everywhere on the site!

## Adding New Services

To add a new service:

1. Add it to the `services` object with a price
2. Add a display name to the `serviceNames` object
3. Update the HTML forms to include the new service option

## Adding New Add-ons

To add a new add-on:

1. Add it to the `addons` object with a price
2. Add a display name to the `addonNames` object
3. Update the HTML booking form to include the new add-on option

## Important Notes

- Always use numbers (not strings) for prices: `50` not `"50"`
- Don't include dollar signs in the price values
- The system automatically formats prices with $ symbols
- Changes take effect immediately when the page is refreshed
- Both the main website and admin panel use the same pricing configuration

## Troubleshooting

If prices don't update:

1. Check that `pricing-config.js` is loading properly (no JavaScript errors in browser console)
2. Make sure you saved the file after making changes
3. Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)
4. Check browser console for any error messages

## File Locations

- **Main config**: `pricing-config.js`
- **Website**: `index.html` (includes pricing-config.js)
- **Admin panel**: `admin.html` (includes pricing-config.js)
- **Price calculator**: `app.js` (uses PricingConfig)
- **Admin functions**: `admin.js` (uses PricingConfig)
