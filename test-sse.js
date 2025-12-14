#!/usr/bin/env node

/**
 * Test SSE stream endpoint
 */
import http from 'http';

const url = 'http://localhost:3001/api/stream/live';

console.log('Connecting to SSE stream...\n');

const request = http.get(url, (response) => {
  let buffer = '';
  let messageCount = 0;

  response.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data:')) {
        messageCount++;
        const data = JSON.parse(line.substring(5));
        
        if (messageCount === 1) {
          console.log('✓ First message received:');
          console.log(`  Type: ${data.type}`);
          console.log(`  Message: ${data.message}\n`);
        } else {
          console.log(`✓ Sample #${messageCount} at ${data.sample.timestamp}`);
          if (data.sample.categories) {
            const categories = Object.keys(data.sample.categories);
            console.log(`  Categories: ${categories.join(', ')}`);
            for (const category of categories) {
              const count = Object.keys(data.sample.categories[category]).length;
              console.log(`    - ${category}: ${count} metrics`);
            }
          }
        }
      }
    }
  });

  setTimeout(() => {
    request.abort();
    console.log(`\n✓ Test completed - Received ${messageCount} messages`);
    process.exit(0);
  }, 5000);
});

request.on('error', (error) => {
  console.error('✗ Error:', error.message);
  process.exit(1);
});
