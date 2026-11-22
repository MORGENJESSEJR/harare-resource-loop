export const APP_NAME = 'Harare Resource Loop'
export const DATA_REVIEW_DATE = '22 Nov 2026'

export type PageId = 'overview' | 'collection' | 'marketplace' | 'reuse' | 'learn' | 'books' | 'community' | 'points' | 'operations' | 'partners' | 'impact'

export const navigation: { id: PageId; label: string; icon: string; group: 'Workspace' | 'Network' | 'Evidence' }[] = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', group: 'Workspace' },
  { id: 'collection', label: 'Collection', icon: 'Truck', group: 'Workspace' },
  { id: 'marketplace', label: 'Resource marketplace', icon: 'Recycle', group: 'Workspace' },
  { id: 'reuse', label: 'Reuse studio', icon: 'Sparkles', group: 'Workspace' },
  { id: 'learn', label: 'Learn & compost', icon: 'Sprout', group: 'Workspace' },
  { id: 'books', label: 'Books & schools', icon: 'BookOpen', group: 'Network' },
  { id: 'community', label: 'Community & giving', icon: 'HeartHandshake', group: 'Network' },
  { id: 'points', label: 'Collection points', icon: 'MapPin', group: 'Network' },
  { id: 'operations', label: 'Smart bins & operations', icon: 'Waves', group: 'Network' },
  { id: 'partners', label: 'Partners', icon: 'Building2', group: 'Evidence' },
  { id: 'impact', label: 'Impact & economics', icon: 'ChartNoAxesCombined', group: 'Evidence' },
]

export const suburbs = ['Mbare', 'Mbare Musika', 'Central Business District', 'Highfield', 'Tafara', 'Mabvuku', 'Willowvale', 'Graniteside', 'Borrowdale', 'Other Harare suburb']
export const materials = ['Organic waste', 'Plastics', 'Paper', 'Glass', 'Metals', 'Residual waste']
export const listingMaterials = ['PET', 'HDPE', 'LDPE', 'PP', 'Glass', 'Paper', 'Cardboard', 'Metal', 'Organic waste', 'Textiles', 'Tyres', 'Wood', 'Electronic waste']
export const materialCatalog = [
  { name: 'PET', filter: 'PET', description: 'Beverage bottles and rigid packaging', icon: 'Package' },
  { name: 'HDPE', filter: 'HDPE', description: 'Rigid bottles and containers', icon: 'Container' },
  { name: 'LDPE', filter: 'LDPE', description: 'Bags and flexible film', icon: 'Layers' },
  { name: 'PP', filter: 'PP', description: 'Tubs, caps and reusable crates', icon: 'PanelsTopLeft' },
  { name: 'Glass', filter: 'Glass', description: 'Bottles and jars', icon: 'GlassWater' },
  { name: 'Paper', filter: 'Paper', description: 'Clean, dry sheets and paper', icon: 'FileText' },
  { name: 'Cardboard', filter: 'Cardboard', description: 'Flattened, clean boxes', icon: 'Package' },
  { name: 'Metals', filter: 'Metal', description: 'Separated cans and scrap', icon: 'Wrench' },
  { name: 'Organic materials', filter: 'Organic waste', description: 'Food scraps and garden waste', icon: 'Leaf' },
  { name: 'Textiles', filter: 'Textiles', description: 'Clean clothing and fabric', icon: 'Shirt' },
  { name: 'Tyres', filter: 'Tyres', description: 'Refer to a specialist handler', icon: 'Disc3' },
  { name: 'Wood', filter: 'Wood', description: 'Repairable items and offcuts', icon: 'TreePine' },
  { name: 'Electronic waste', filter: 'Electronic waste', description: 'Devices for specialist collection', icon: 'Cpu' },
] as const

export const research = [
  { label: 'Municipal waste generated', value: '798', unit: 'tonnes / day', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
  { label: 'Waste collected', value: '204', unit: 'tonnes / day · 26%', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
  { label: 'Managed in controlled facilities', value: '15', unit: 'tonnes / day · 2%', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
  { label: 'City recovery rate', value: '5%', unit: 'of waste generated', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
  { label: 'Per-capita municipal waste generation', value: '0.56', unit: 'kg / person / day', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
  { label: 'Household food waste generation', value: '0.11', unit: 'kg / person / day', period: '2021 assessment', source: 'UN-Habitat Waste Wise Cities Tool · Harare', href: 'https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf', type: 'Official research' },
]

export const initialRequests = [
  { id: 'HRL-1042', suburb: 'Highfield', materials: ['Plastics', 'Paper'], date: '2026-11-25', note: 'Gate on Chiremba Road', status: 'Awaiting collector', quantity: '' },
  { id: 'HRL-1041', suburb: 'Mbare', materials: ['Organic waste'], date: '2026-11-24', note: 'Community garden entrance', status: 'Assigned', quantity: '' },
  { id: 'HRL-1039', suburb: 'Tafara', materials: ['Metals', 'Glass'], date: '2026-11-22', note: 'Call on arrival', status: 'Completed', quantity: '18 kg' },
]

export const initialListings = [
  { id: 'MAT-208', material: 'PET', quantity: '42 kg', location: 'Mbare', condition: 'Baled', cleanliness: 'Rinsed', sorting: 'Sorted by type', availability: 'Ready this week', price: 'Quotation requested', preference: 'Pickup preferred', seller: 'Community collector', description: 'Clear beverage bottles, dry and bagged.' },
  { id: 'MAT-207', material: 'Cardboard', quantity: '120 kg', location: 'Willowvale', condition: 'Flattened', cleanliness: 'Dry', sorting: 'Sorted by type', availability: 'Available now', price: 'Open to quotation', preference: 'Pickup only', seller: 'Small business', description: 'Clean shipping boxes, no wax coating.' },
  { id: 'MAT-206', material: 'Organic waste', quantity: '60 kg', location: 'Highfield', condition: 'Fresh', cleanliness: 'Separate stream', sorting: 'Sorted by type', availability: 'Weekly', price: 'Free for community garden', preference: 'Buyer collection', seller: 'Household group', description: 'Fruit and vegetable scraps for composting.' },
]

export const initialBooks = [
  { id: 'BK-301', title: 'Mathematics Form 2', grade: 'Form 2', subject: 'Mathematics', edition: 'ZIMSEC · 2022 edition', condition: 'Good', offer: 'Exchange', location: 'Avondale', owner: 'Student household' },
  { id: 'BK-300', title: 'Shona Language Form 1', grade: 'Form 1', subject: 'Shona', edition: 'Curriculum edition to confirm', condition: 'Fair · cover repaired', offer: 'Donation', location: 'Mbare', owner: 'Community book bank' },
]

export type Organisation = { name: string; category: string; location: string; website: string; support: string; relationship: string; needs: string; contact: string; giving: string; volunteering: string; reviewedOn: string }
export const organisations: Organisation[] = [
  { name: "Harare Children's Home", category: "Children's home", location: 'Harare', website: 'https://hararechildrenshome.org.zw/', support: 'https://hararechildrenshome.org.zw/ways-to-support/', relationship: 'Community organisation', needs: 'Official page lists gardening project, textbooks and computers for the library, groceries, and other needs. Confirm current priorities before delivery.', contact: '+263 242 747086 / +263 242 747087 · 2 Daventry Road, Eastlea, Harare (published on its official site)', giving: 'In-kind and financial support are described on the official site; use its official channel and confirm current instructions.', volunteering: 'The official support page invites volunteers to share skills; coordinate all visits directly and follow the Home’s safeguarding requirements.', reviewedOn: 'Official support and contact pages reviewed 22 Nov 2026; organisation-published information, not independently verified.' },
  { name: 'SOS Children’s Villages Zimbabwe', category: "Children's services organisation", location: 'Zimbabwe', website: 'https://www.sos-zimbabwe.org/', support: 'https://www.sos-zimbabwe.org/donate/', relationship: 'Community organisation', needs: 'Contact organisation to confirm current needs.', contact: 'Use the official website contact channel; details not entered in this directory.', giving: 'Review the official donate page and confirm current options directly.', volunteering: 'Contact the organisation to confirm supervised volunteering opportunities.', reviewedOn: 'Official website / donate link reviewed 22 Nov 2026; current needs and details not independently confirmed.' },
  { name: 'Newstart Children’s Home', category: "Children's home", location: 'Harare area · confirm directly', website: 'https://newstartchildrenshome.org/', support: 'https://newstartchildrenshome.org/', relationship: 'Community organisation', needs: 'Contact organisation to confirm current needs.', contact: 'Use the official website contact channel; details not entered in this directory.', giving: 'Contact the organisation to confirm accepted items and official donation channels.', volunteering: 'Contact the organisation to confirm supervised volunteering opportunities.', reviewedOn: 'Website supplied in project brief; current details not independently reviewed.' },
  { name: 'Patricia Jabangwe Children’s Home', category: "Children's home", location: 'Harare area · confirm directly', website: 'https://pjchildrenshome.org/', support: 'https://pjchildrenshome.org/', relationship: 'Community organisation', needs: 'Contact organisation to confirm current needs.', contact: 'Use the official website contact channel; details not entered in this directory.', giving: 'Contact the organisation to confirm accepted items and official donation channels.', volunteering: 'Contact the organisation to confirm supervised volunteering opportunities.', reviewedOn: 'Website supplied in project brief; current details not independently reviewed.' },
  { name: 'Danai Francisca Children’s Village', category: "Children's home", location: 'Zimbabwe · confirm directly', website: 'https://danaifranciscachildrensvillage.org/', support: 'https://danaifranciscachildrensvillage.org/', relationship: 'Community organisation', needs: 'Contact organisation to confirm current needs.', contact: 'Use the official website contact channel; details not entered in this directory.', giving: 'Contact the organisation to confirm accepted items and official donation channels.', volunteering: 'Contact the organisation to confirm supervised volunteering opportunities.', reviewedOn: 'Website supplied in project brief; current details not independently reviewed.' },
  { name: 'Childline Zimbabwe', category: 'Child protection organisation', location: 'Zimbabwe', website: 'https://www.childline.org.zw/', support: 'https://www.childline.org.zw/', relationship: 'Community organisation', needs: 'Contact organisation to confirm current needs.', contact: 'Official site lists 31 Frank Johnson Avenue, Eastlea, Harare; use its current contact channel for updates.', giving: 'Contact the organisation to confirm whether it accepts a specific type of donation.', volunteering: 'Contact the organisation about approved child-protection roles and required safeguarding training.', reviewedOn: 'Official website reviewed 22 Nov 2026 for category and contact location; donation and volunteer details not independently confirmed.' },
  { name: 'Books on Wheels', category: 'Education initiative', location: 'Harare', website: 'https://ndeipi.co.zw/books-on-wheels/', support: 'https://ndeipi.co.zw/books-on-wheels/', relationship: 'Historical initiative / case study', needs: 'Published account describes book donations; contact the initiative to confirm current collection needs.', contact: 'Use the linked organisation-published account and reconfirm its contact details before using them.', giving: 'The published account describes used and new children’s books; confirm current age ranges and condition requirements.', volunteering: 'Contact the initiative to confirm current opportunities and arrangements.', reviewedOn: 'Organisation-published account reviewed 22 Nov 2026; its figures and contact details may be historical.' },
]

export const partnerGroups: { category: string; names: string[]; relation: string }[] = [
  { category: 'Public authorities & regulators', relation: 'Regulator / public authority · prospective coordination', names: ['Environmental Management Agency (EMA)', 'City of Harare – Works Department', 'Geo Pomona Waste Management', 'Geogenics BV'] },
  { category: 'Community & development', relation: 'Potential funding partner / community organisation / case study', names: ['Practical Action Zimbabwe', 'Swedish International Development Cooperation Agency (Sida)', 'Zimbabwe Sunshine Group', 'Books on Wheels', "Harare Children's Home", 'SOS Children’s Villages Zimbabwe', 'Newstart Children’s Home', 'Patricia Jabangwe Children’s Home', 'Danai Francisca Children’s Village', 'Childline Zimbabwe'] },
  { category: 'Plastic & material recovery', relation: 'Potential commercial partner', names: ['Waverley Plastics', 'Marashe Plastics', 'Stable Packaging', 'Recycling Solutions (Private) Limited', 'Pyro Zim'] },
  { category: 'Tyre recovery', relation: 'Potential commercial partner', names: ['Vulca Technologies'] },
  { category: 'Packaging & paper', relation: 'Potential producer recovery partner', names: ['Delta Corporation', 'Coca-Cola Beverages Zimbabwe', 'Lobels'] },
  { category: 'Infrastructure & manufacturing suppliers', relation: 'Potential supplier', names: ['Zimbabwe Building Materials Suppliers', 'Steel Centre International', 'Prevail Concrete', 'Trigo Metal Engineering'] },
  { category: 'Reference & benchmark systems', relation: 'Technology benchmark / historical initiative', names: ['GAD Netherlands', 'BinGo Zimbabwe'] },
]

export const eventsSeed = [
  { id: 'EV-41', name: 'Mbare market clean-up and sorting day', organiser: 'Community demonstration group', location: 'Mbare · meeting point confirmed after registration', date: '2026-11-29', hours: 3, skills: 'Sorting, coordination', places: 18, safeguarding: 'Public space activity; coordinate with local authorities.' },
  { id: 'EV-42', name: 'School garden compost workshop', organiser: 'Community garden demonstration', location: 'Highfield · venue to be confirmed', date: '2026-12-03', hours: 2, skills: 'Gardening, composting', places: 10, safeguarding: 'Activities with children require school staff supervision.' },
  { id: 'EV-43', name: 'Repair and reuse skills exchange', organiser: 'Neighbourhood demonstration group', location: 'CBD · venue to be confirmed', date: '2026-12-06', hours: 2, skills: 'Mending, small repairs', places: 12, safeguarding: 'Bring tools only after organiser confirmation.' },
]

export const binsSeed = [
  { id: 'SIM-01', location: 'Mbare · market edge', waste: 'Mixed recyclables', fill: 92, rate: 16, last: '21 Nov · 08:10', status: 'Near full' },
  { id: 'SIM-02', location: 'Highfield · community garden', waste: 'Organics', fill: 68, rate: 11, last: '20 Nov · 15:40', status: 'Filling' },
  { id: 'SIM-03', location: 'CBD · demonstration site', waste: 'Paper & cardboard', fill: 44, rate: 7, last: '21 Nov · 11:20', status: 'Normal' },
  { id: 'SIM-04', location: 'Graniteside · industrial area', waste: 'PET / HDPE', fill: 100, rate: 20, last: '19 Nov · 16:00', status: 'Full' },
  { id: 'SIM-05', location: 'Tafara · demonstration site', waste: 'Mixed recyclables', fill: 28, rate: 4, last: '21 Nov · 09:15', status: 'Maintenance required' },
]

export const collectionPoints = ['Mbare', 'Mbare Musika', 'Central Business District', 'Highfield', 'Tafara', 'Mabvuku', 'Willowvale', 'Graniteside'].map((area, i) => ({
  id: `CP-${String(i + 1).padStart(2, '0')}`, area,
  materials: [['PET', 'Cardboard', 'Metals'], ['Cardboard', 'PET'], ['Paper', 'Cardboard', 'Small e-waste'], ['Organics', 'PET', 'Textiles'], ['PET', 'Metals'], ['PET', 'Cardboard'], ['Cardboard', 'HDPE', 'Metals'], ['HDPE', 'PET', 'Metals']][i],
  hours: ['Schedule by request', 'Market hours · confirm locally', 'Weekdays · request collection', 'Community garden schedule', 'Schedule by request', 'Schedule by request', 'Weekdays · request collection', 'Weekdays · request collection'][i],
  service: ['Community drop-off proposal', 'Material exchange proposal', 'Business pickup coordination', 'Compost and recycling coordination', 'Neighbourhood collection proposal', 'Neighbourhood collection proposal', 'Business pickup coordination', 'Business pickup coordination'][i],
}))
