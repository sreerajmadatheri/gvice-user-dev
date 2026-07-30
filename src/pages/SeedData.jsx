import React, { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockNews, mockTenders, mockProjects } from '../data/mockData';

// We import equipmentListings from Auction.jsx manually or copy it here for seeding
const equipmentListings = [
  {
    id: 'req-1',
    company: 'GVICE Procurement',
    name: 'WANTED: Nitrogen Unit & Pumping Unit',
    sector: 'oil',
    specs: [{ label: 'Requirement', val: 'Purchase' }, { label: 'Location', val: 'Saudi Arabia' }, { label: 'Condition', val: 'Operational' }],
    price: 'Open for Bidding',
    featured: true,
    img: '/images/Second Post-02.jpg',
  },
  {
    id: 1,
    company: 'Al-Rashid Heavy Industries',
    name: 'Liebherr LTM 1750-9.1 All-Terrain Crane',
    sector: 'oil',
    specs: [{ label: 'Capacity', val: '750T' }, { label: 'Boom', val: '100m' }, { label: 'Year', val: '2022' }],
    price: '$4,200,000',
    featured: true,
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 2,
    company: 'Gulf Marine Services',
    name: 'DP2 Anchor Handling Tug Supply Vessel',
    sector: 'marine',
    specs: [{ label: 'Length', val: '85m' }, { label: 'BHP', val: '16,000' }, { label: 'Year', val: '2020' }],
    price: '$28,500,000',
    featured: true,
    img: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 3,
    company: 'Bin Laden Construction Group',
    name: 'Caterpillar 390F Hydraulic Excavator',
    sector: 'civil',
    specs: [{ label: 'Engine', val: '395HP' }, { label: 'Weight', val: '90T' }, { label: 'Year', val: '2023' }],
    price: '$920,000',
    featured: false,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=70',
  },
  {
    id: 4,
    company: 'Saudi Aramco Contractors Ltd.',
    name: 'Dreco 1500HP Oil Drilling Rig Package',
    sector: 'oil',
    specs: [{ label: 'Depth', val: '7,500m' }, { label: 'Power', val: '1,500HP' }, { label: 'Year', val: '2021' }],
    price: '$12,800,000',
    featured: true,
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=70',
  },
];

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const seedDatabase = async () => {
    setLoading(true);
    setMessage('Uploading data to Firestore...');
    try {
      const batch = writeBatch(db);

      // Seed News
      mockNews.forEach((news) => {
        const docRef = doc(collection(db, 'news'));
        batch.set(docRef, { ...news });
      });

      // Seed Tenders
      mockTenders.forEach((tender) => {
        const docRef = doc(collection(db, 'tenders'));
        batch.set(docRef, { ...tender });
      });

      // Seed Equipment
      equipmentListings.forEach((equipment) => {
        const docRef = doc(collection(db, 'equipmentListings'));
        batch.set(docRef, { ...equipment });
      });

      // Seed Projects
      mockProjects.forEach((project) => {
        const docRef = doc(collection(db, 'projects'));
        batch.set(docRef, { ...project });
      });

      await batch.commit();
      setMessage('Successfully seeded database! You can now delete this page.');
    } catch (error) {
      console.error(error);
      setMessage(`Error seeding database: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', backgroundColor: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '20px' }}>
        Firebase Database Seeder
      </h1>
      <p style={{ marginBottom: '20px' }}>
        Click the button below to upload the mock data (News, Tenders, Equipment and Projects) into your Firestore database.
      </p>
      <button 
        className="primary-btn" 
        onClick={seedDatabase} 
        disabled={loading}
      >
        {loading ? 'Seeding...' : 'Seed Database Now'}
      </button>
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
};

export default SeedData;

