const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'mockData.js');
let data = fs.readFileSync(dataPath, 'utf8');

const generateArticles = () => {
  const categories = ["Infrastructure", "Energy", "Technology", "Trade", "Finance", "Vision 2030", "Real Estate"];
  const images = [
    "/images/main (1).jpg", "/images/main (2).jpg", "/images/main (3).jpg", 
    "/images/main (4).jpg", "/images/main (5).jpg", "/images/main.jpg",
    "/images/main.png", "/images/main (1).gif"
  ];
  const authors = ["GVICE Intelligence", "Energy Desk", "Tech & Innovation", "Finance Desk", "Riyadh Desk"];
  
  let newArticles = "";
  for(let i = 12; i < 62; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const image = images[Math.floor(Math.random() * images.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    
    newArticles += `  {
    id: ${i}, 
    category: "${category}", 
    title: "Saudi Aramco Strategic Expansion Initiative Phase ${i - 11}", 
    author: "${author}", 
    date: "June ${Math.floor(Math.random() * 28) + 1}, 2026", 
    image: "${image}",
    excerpt: "Comprehensive data and project intelligence on the latest Aramco expansion tenders and EPC developments.",
    body: "<p>This exclusive GVICE report covers the extensive details of the upcoming strategic expansion. Key stakeholders and international contractors are preparing for a rigorous bidding process.</p><h2>Project Scope</h2><p>The scope includes massive downstream integration and upstream capacity boosting. Detailed tender specifications will be released in the upcoming quarter.</p>",
    featured: false
  }`;
    if (i < 61) newArticles += ",\n";
  }
  
  return newArticles;
};

// Find the end of mockNews array
const insertIndex = data.indexOf("];\n\nexport const mockTenders");
if (insertIndex !== -1) {
  const before = data.substring(0, insertIndex);
  const after = data.substring(insertIndex);
  const updatedData = before + ",\n" + generateArticles() + "\n" + after;
  fs.writeFileSync(dataPath, updatedData, 'utf8');
  console.log("Successfully added 50 articles.");
} else {
  console.error("Could not find mockNews array end.");
}
