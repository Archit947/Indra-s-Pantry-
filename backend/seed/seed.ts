/**
 * Seed script — run with: npm run seed
 * Creates admin user, test user, categories, and sample items.
 */
import '../src/config/env';
import { supabase } from '../src/config/supabase';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting Indra\'s Pantry seed...\n');

  // ── Admin user ─────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12);
  const { error: ae } = await supabase.from('users').upsert(
    { email: 'admin@canteenhub.com', password_hash: adminHash, name: 'Admin', role: 'admin' },
    { onConflict: 'email' }
  );
  if (!ae) console.log('✅ Admin user      → admin@canteenhub.com / admin123');
  else console.error('❌ Admin error:', ae.message);

  // ── Regular test user ──────────────────────────────────────
  const userHash = await bcrypt.hash('user123', 12);
  const { error: ue } = await supabase.from('users').upsert(
    { email: 'user@canteenhub.com', password_hash: userHash, name: 'Test User', phone: '9876543210', role: 'user' },
    { onConflict: 'email' }
  );
  if (!ue) console.log('✅ Test user       → user@canteenhub.com  / user123');
  else console.error('❌ User error:', ue.message);

  // ── Categories ─────────────────────────────────────────────
  const categories = [
    { name: 'Breakfast',  description: 'Morning starters to fuel your day' },
    { name: 'Lunch',      description: 'Hearty midday meals' },
    { name: 'Snacks',     description: 'Light bites anytime' },
    { name: 'Beverages',  description: 'Hot & cold drinks' },
    { name: 'Desserts',   description: 'Sweet treats to end your meal' },
  ];

  const { data: cats, error: ce } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'name' })
    .select();

  if (ce) { console.error('❌ Categories error:', ce.message); process.exit(1); }
  console.log('✅ Categories      →', cats?.map((c) => c.name).join(', '));

  const catMap: Record<string, string> = {};
  cats?.forEach((c) => { catMap[c.name] = c.id; });

  // ── Items ──────────────────────────────────────────────────
  const items = [
    { category_id: catMap['Breakfast'], name: 'Masala Dosa',       description: 'Crispy dosa with spicy potato filling & chutneys',          price: 60 },
    { category_id: catMap['Breakfast'], name: 'Idli Sambar',       description: '4 soft idlis served with sambar and coconut chutney',       price: 40 },
    { category_id: catMap['Breakfast'], name: 'Poha',              description: 'Spiced flattened rice with onion, peanuts & curry leaves',  price: 35 },
    { category_id: catMap['Breakfast'], name: 'Upma',              description: 'Semolina porridge with vegetables',                         price: 30 },
    { category_id: catMap['Lunch'],     name: 'Veg Thali',         description: 'Rice, dal, 2 sabzis, roti, salad & pickle',                price: 120 },
    { category_id: catMap['Lunch'],     name: 'Chicken Biryani',   description: 'Aromatic basmati rice with tender spiced chicken',          price: 150 },
    { category_id: catMap['Lunch'],     name: 'Dal Makhani',       description: 'Creamy slow-cooked black lentils',                         price: 90 },
    { category_id: catMap['Lunch'],     name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-butter gravy',           price: 110 },
    { category_id: catMap['Snacks'],    name: 'Samosa (2 pc)',     description: 'Crispy pastry pockets with spiced potato filling',         price: 20 },
    { category_id: catMap['Snacks'],    name: 'Vada Pav',          description: "Mumbai's favourite street-food burger",                    price: 25 },
    { category_id: catMap['Snacks'],    name: 'Bread Pakora',      description: 'Deep-fried bread stuffed with potato & green chutney',     price: 30 },
    { category_id: catMap['Snacks'],    name: 'Pav Bhaji',         description: 'Spiced vegetable mash with buttered pav',                  price: 70 },
    { category_id: catMap['Beverages'], name: 'Masala Chai',       description: 'Classic spiced milk tea',                                  price: 20 },
    { category_id: catMap['Beverages'], name: 'Filter Coffee',     description: 'South Indian decoction coffee',                            price: 25 },
    { category_id: catMap['Beverages'], name: 'Fresh Lime Soda',   description: 'Chilled lime soda — sweet or salted',                      price: 30 },
    { category_id: catMap['Beverages'], name: 'Mango Lassi',       description: 'Thick yogurt mango smoothie',                              price: 55 },
    { category_id: catMap['Desserts'],  name: 'Gulab Jamun (2 pc)', description: 'Soft milk-solid balls soaked in rose sugar syrup',        price: 40 },
    { category_id: catMap['Desserts'],  name: 'Kheer',             description: 'Creamy rice pudding with saffron & cardamom',              price: 50 },
    { category_id: catMap['Desserts'],  name: 'Ice Cream',         description: 'Vanilla or Chocolate — 2 scoops',                         price: 60 },
  ];

  const stockLevels = [20, 25, 18, 15, 14, 12, 16, 16, 30, 28, 20, 15, 40, 35, 22, 18, 20, 14, 18];
  const itemsWithStock = items.map((item, index) => ({
    ...item,
    stock: stockLevels[index] ?? 10,
  }));

  const { error: ie } = await supabase
    .from('items')
    .upsert(itemsWithStock, { onConflict: 'name' });

  if (!ie) console.log(`✅ Items           → ${items.length} items seeded`);
  else console.error('❌ Items error:', ie.message);

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Admin  → admin@canteenhub.com / admin123');
  console.log('  User   → user@canteenhub.com  / user123');
  console.log('─────────────────────────────────────────');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
