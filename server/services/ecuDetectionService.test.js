import ecuDetectionService from './ecuDetectionService.js';
import MockSerialConnection from './mockSerialConnection.js';

/**
 * Test suite for EcuDetectionService
 */

// Test: Initialize adapter with AT commands
export async function testInitializeAdapter() {
  console.log('\n=== Test: Initialize Adapter ===');
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
  });

  ecuDetectionService.setSerialConnection(mockConnection);

  try {
    const results = await ecuDetectionService.initializeAdapter();
    console.log('✓ Adapter initialized successfully');
    console.log('  Commands sent:', mockConnection.getCommandHistory());
    
    const requiredCommands = ['ATZ', 'ATE0', 'ATL0', 'ATS0'];
    const allCommandsSent = requiredCommands.every(cmd => mockConnection.wasCommandSent(cmd));
    
    if (allCommandsSent) {
      console.log('✓ All required AT initialization commands were sent');
      return true;
    } else {
      console.log('✗ Missing some AT initialization commands');
      return false;
    }
  } catch (error) {
    console.log('✗ Adapter initialization failed:', error.message);
    return false;
  }
}

// Test: Detect protocol
export async function testDetectProtocol() {
  console.log('\n=== Test: Detect Protocol ===');
  const mockConnection = new MockSerialConnection({
    protocol: 'ISO 15765-4',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  mockConnection.resetHistory();

  try {
    const protocol = await ecuDetectionService.detectProtocol();
    console.log('✓ Protocol detected:', protocol);
    console.log('  Commands sent:', mockConnection.getCommandHistory());
    
    if (mockConnection.wasCommandSent('ATSP0') && mockConnection.wasCommandSent('ATDP')) {
      console.log('✓ Required protocol detection commands were sent');
      return true;
    } else {
      console.log('✗ Missing protocol detection commands');
      return false;
    }
  } catch (error) {
    console.log('✗ Protocol detection failed:', error.message);
    return false;
  }
}

// Test: Query Mode 09 data
export async function testQueryMode09Data() {
  console.log('\n=== Test: Query Mode 09 Data ===');
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  mockConnection.resetHistory();

  try {
    const mode09Data = await ecuDetectionService.queryMode09Data();
    console.log('✓ Mode 09 data queried successfully');
    console.log('  Commands sent:', mockConnection.getCommandHistory());
    
    const expectedPIDs = ['02', '04', '06', '09'];
    const allPIDsQueried = expectedPIDs.every(pid => mockConnection.wasCommandSent(`09${pid}`));
    
    if (allPIDsQueried) {
      console.log('✓ All required Mode 09 PIDs were queried');
      return true;
    } else {
      console.log('✗ Missing some Mode 09 PID queries');
      return false;
    }
  } catch (error) {
    console.log('✗ Mode 09 query failed:', error.message);
    return false;
  }
}

// Test: Map VIN to manufacturer
export async function testVINToManufacturerMapping() {
  console.log('\n=== Test: VIN to Manufacturer Mapping ===');
  
  const testCases = [
    { vin: 'WBADT43452G906976', expected: 'bmw', description: 'BMW (WBA)' },
    { vin: 'KMHEC4A46EU123456', expected: 'hyundai', description: 'Hyundai (KMH)' },
    { vin: 'JTNBB46K0C5012345', expected: 'toyota', description: 'Toyota (JT)' },
    { vin: 'VF7XXXXXXXXXXXXXXX', expected: 'peugeot', description: 'Peugeot (VF7)' },
  ];

  let allPassed = true;
  
  for (const { vin, expected, description } of testCases) {
    const manufacturer = ecuDetectionService.mapVINToManufacturer(vin);
    if (manufacturer === expected) {
      console.log(`✓ ${description}: correctly mapped to '${manufacturer}'`);
    } else {
      console.log(`✗ ${description}: expected '${expected}', got '${manufacturer}'`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Test: Full detection flow
export async function testFullDetectionFlow() {
  console.log('\n=== Test: Full ECU Detection Flow ===');
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976', // BMW VIN
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
    protocol: 'ISO 15765-4',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();
  mockConnection.resetHistory();

  try {
    const result = await ecuDetectionService.detect({ useCache: false });
    
    console.log('✓ Full detection completed');
    console.log('  Status:', result.status);
    console.log('  VIN:', result.vin);
    console.log('  Manufacturer:', result.manufacturer);
    console.log('  Protocol:', result.protocol);
    console.log('  Supported Modes:', result.supportedModes);
    console.log('  Detection Time:', result.detectionTime, 'ms');
    
    const commandHistory = mockConnection.getCommandHistory();
    console.log('  Total commands sent:', commandHistory.length);
    console.log('  Command sequence:', commandHistory.join(' → '));
    
    // Verify expected commands
    const expectedSequence = ['ATZ', 'ATE0', 'ATL0', 'ATS0', 'ATSP0', 'ATDP'];
    const hasExpectedSequence = expectedSequence.every(cmd => mockConnection.wasCommandSent(cmd));
    
    if (hasExpectedSequence && result.status === 'success' && result.vin === 'WBADT43452G906976') {
      console.log('✓ Full detection flow completed successfully');
      return true;
    } else {
      console.log('✗ Full detection flow incomplete or has issues');
      if (!hasExpectedSequence) {
        console.log('  Missing commands in sequence');
      }
      if (result.status !== 'success') {
        console.log('  Detection returned error status');
      }
      if (result.vin !== 'WBADT43452G906976') {
        console.log('  VIN not correctly extracted');
      }
      return false;
    }
  } catch (error) {
    console.log('✗ Full detection failed:', error.message);
    return false;
  }
}

// Test: Cache functionality
export async function testCacheFunctionality() {
  console.log('\n=== Test: Cache Functionality ===');
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();
  mockConnection.resetHistory();

  try {
    // First detection (should populate cache)
    const result1 = await ecuDetectionService.detect({ useCache: true });
    const commandCount1 = mockConnection.getCommandHistory().length;
    
    // Reset command history and try again
    mockConnection.resetHistory();
    
    // Second detection with cache (should use cache, not run commands)
    const result2 = await ecuDetectionService.detect({ useCache: true });
    const commandCount2 = mockConnection.getCommandHistory().length;
    
    console.log(`✓ First detection sent ${commandCount1} commands`);
    console.log(`✓ Second detection sent ${commandCount2} commands (cache hit)`);
    
    if (commandCount2 === 0 && result1.vin === result2.vin) {
      console.log('✓ Cache functionality working correctly');
      return true;
    } else {
      console.log('✗ Cache not working as expected');
      return false;
    }
  } catch (error) {
    console.log('✗ Cache test failed:', error.message);
    return false;
  }
}

// Test: PID file loading
export async function testPIDFileLoading() {
  console.log('\n=== Test: PID File Loading ===');
  
  const manufacturers = ['bmw', 'hyundai', 'kia', 'peugeot', 'ikco'];
  let allLoaded = true;

  for (const manufacturer of manufacturers) {
    try {
      const pidData = await ecuDetectionService.loadManufacturerPIDs(manufacturer);
      if (pidData && pidData.manufacturer === manufacturer && pidData.pids) {
        console.log(`✓ Loaded PID file for ${manufacturer} (${pidData.pids.length} PIDs)`);
      } else {
        console.log(`✗ PID file for ${manufacturer} has invalid structure`);
        allLoaded = false;
      }
    } catch (error) {
      console.log(`✗ Failed to load PID file for ${manufacturer}:`, error.message);
      allLoaded = false;
    }
  }

  return allLoaded;
}

// Run all tests
export async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ECU Detection Service Test Suite   ║');
  console.log('╚════════════════════════════════════════╝');

  const tests = [
    { name: 'Initialize Adapter', fn: testInitializeAdapter },
    { name: 'Detect Protocol', fn: testDetectProtocol },
    { name: 'Query Mode 09 Data', fn: testQueryMode09Data },
    { name: 'VIN to Manufacturer Mapping', fn: testVINToManufacturerMapping },
    { name: 'PID File Loading', fn: testPIDFileLoading },
    { name: 'Cache Functionality', fn: testCacheFunctionality },
    { name: 'Full Detection Flow', fn: testFullDetectionFlow },
  ];

  const results = [];
  for (const { name, fn } of tests) {
    try {
      const passed = await fn();
      results.push({ name, passed });
    } catch (error) {
      console.log(`\n✗ Test execution failed: ${error.message}`);
      results.push({ name, passed: false });
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║              Test Summary              ║');
  console.log('╚════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  for (const { name, passed: testPassed } of results) {
    const icon = testPassed ? '✓' : '✗';
    console.log(`${icon} ${name}`);
  }
  
  console.log(`\nResults: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
  }

  return passed === total;
}

// Export test runner
const isMainModule = process.argv[1]?.endsWith('ecuDetectionService.test.js');
if (isMainModule) {
  runAllTests().catch(console.error);
}
