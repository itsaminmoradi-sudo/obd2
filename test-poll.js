#!/usr/bin/env node

/**
 * Test long-poll endpoint
 */
import http from 'http';

async function pollOnce() {
  return new Promise((resolve, reject) => {
    const url = 'http://localhost:3001/api/stream/poll?timeout=5000';
    
    const request = http.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    request.on('error', reject);
  });
}

console.log('Testing long-poll endpoint...\n');

try {
  for (let i = 0; i < 3; i++) {
    console.log(`Poll #${i + 1}:`);
    const result = await pollOnce();
    
    if (result.type === 'data') {
      const sample = result.sample;
      console.log(`  Timestamp: ${sample.timestamp}`);
      console.log(`  Categories: ${Object.keys(sample.categories).join(', ')}`);
      for (const [category, data] of Object.entries(sample.categories)) {
        const count = Object.keys(data).length;
        console.log(`    - ${category}: ${count} metrics`);
      }
    } else {
      console.log(`  Type: ${result.type}`);
      console.log(`  Message: ${result.message}`);
    }
    console.log();
  }
  
  console.log('✓ All polls completed successfully!');
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
