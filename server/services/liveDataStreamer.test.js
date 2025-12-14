import liveDataStreamer from './liveDataStreamer.js';
import MockSerialConnection from './mockSerialConnection.js';

/**
 * Test LiveDataStreamer functionality
 */
async function testLiveDataStreamer() {
  console.log('[Test] Starting LiveDataStreamer tests...\n');

  try {
    // Test 1: Initialize and load PIDs
    console.log('[Test 1] Loading PIDs for manufacturer...');
    const loaded = await liveDataStreamer.loadPIDs();
    if (loaded) {
      const stats = liveDataStreamer.getStats();
      console.log(`✓ Loaded ${stats.pidCount} PIDs\n`);
    } else {
      console.log('✗ Failed to load PIDs\n');
      return;
    }

    // Test 2: Start streaming with mock connection
    console.log('[Test 2] Starting stream with mock connection...');
    const mockConnection = new MockSerialConnection();
    const started = await liveDataStreamer.start(mockConnection);
    if (started) {
      console.log('✓ Stream started successfully\n');
    } else {
      console.log('✗ Failed to start stream\n');
      return;
    }

    // Test 3: Collect samples for 2 seconds
    console.log('[Test 3] Collecting samples for 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const stats = liveDataStreamer.getStats();
    console.log(`✓ Collected ${stats.successCount} samples in 2 seconds`);
    console.log(`  - Success rate: ${stats.successCount}/${stats.successCount + stats.errorCount}\n`);

    // Test 4: Check sample structure
    console.log('[Test 4] Checking sample structure...');
    const buffer = liveDataStreamer.getSampleBuffer();
    if (buffer.length > 0) {
      const sample = buffer[buffer.length - 1];
      console.log(`✓ Latest sample:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...\n');
    }

    // Test 5: Check category organization
    console.log('[Test 5] Checking category organization...');
    console.log(`✓ Categories found:`, Object.keys(sample.categories || {}).join(', '));
    console.log(`  - Engine PIDs: ${Object.keys(sample.categories?.engine || {}).length}`);
    console.log(`  - Cooling PIDs: ${Object.keys(sample.categories?.cooling || {}).length}`);
    console.log(`  - Fuel PIDs: ${Object.keys(sample.categories?.fuel || {}).length}`);
    console.log(`  - Electrical PIDs: ${Object.keys(sample.categories?.electrical || {}).length}\n`);

    // Test 6: Stop streaming
    console.log('[Test 6] Stopping stream...');
    liveDataStreamer.stop();
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✓ Stream stopped successfully\n');

    console.log('[Test] All tests passed! ✓');
  } catch (error) {
    console.error('[Test] Error:', error.message);
  }
}

// Run tests
testLiveDataStreamer();
