/**
 * Integration tests for ECU Detection Service
 * Tests the full flow without requiring a running server
 */

import ecuDetectionService from '../services/ecuDetectionService.js';
import MockSerialConnection from '../services/mockSerialConnection.js';

// Test Case 1: Full detection flow with BMW VIN
export async function testBMWVINDetection() {
  console.log('\n--- Test: BMW VIN Detection ---');
  
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();

  const result = await ecuDetectionService.detect({ useCache: false });

  const checks = [
    {
      name: 'Status is success',
      pass: result.status === 'success',
    },
    {
      name: 'VIN extracted correctly',
      pass: result.vin === 'WBADT43452G906976',
    },
    {
      name: 'Manufacturer mapped to BMW',
      pass: result.manufacturer === 'bmw',
    },
    {
      name: 'Protocol detected',
      pass: result.protocol !== null,
    },
    {
      name: 'Supported modes populated',
      pass: result.supportedModes && result.supportedModes.length > 0,
    },
    {
      name: 'PID metadata loaded',
      pass: result.pidMetadata !== null && result.pidMetadata.pids,
    },
    {
      name: 'ECU identifiers present',
      pass: result.ecuIdentifiers && result.ecuIdentifiers.vin === 'WBADT43452G906976',
    },
    {
      name: 'Adapter init commands executed',
      pass: mockConnection.wasCommandSent('ATZ') &&
            mockConnection.wasCommandSent('ATE0') &&
            mockConnection.wasCommandSent('ATL0') &&
            mockConnection.wasCommandSent('ATS0'),
    },
    {
      name: 'Protocol detection commands executed',
      pass: mockConnection.wasCommandSent('ATSP0') &&
            mockConnection.wasCommandSent('ATDP'),
    },
    {
      name: 'Mode 09 queries executed',
      pass: mockConnection.wasCommandSent('0902') &&
            mockConnection.wasCommandSent('0904') &&
            mockConnection.wasCommandSent('0906') &&
            mockConnection.wasCommandSent('0909'),
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 2: Hyundai detection
export async function testHyundaiDetection() {
  console.log('\n--- Test: Hyundai VIN Detection ---');
  
  const mockConnection = new MockSerialConnection({
    vin: 'KMHEC4A46EU123456',
    calibrationId: 'HY0987654',
    ecuName: 'ENGINE_ECU',
    hwSwVersion: '5.2,9.1',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();

  const result = await ecuDetectionService.detect({ useCache: false });

  const checks = [
    {
      name: 'VIN extracted',
      pass: result.vin === 'KMHEC4A46EU123456',
    },
    {
      name: 'Manufacturer mapped to Hyundai',
      pass: result.manufacturer === 'hyundai',
    },
    {
      name: 'Hyundai PID file loaded',
      pass: result.pidMetadata && result.pidMetadata.manufacturer === 'hyundai',
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 3: Toyota detection
export async function testToyotaDetection() {
  console.log('\n--- Test: Toyota VIN Detection ---');
  
  const mockConnection = new MockSerialConnection({
    vin: 'JTNBB46K0C5012345',
    calibrationId: 'TY1234567',
    ecuName: 'TOYOTA_ECU',
    hwSwVersion: '3.1,8.5',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();

  const result = await ecuDetectionService.detect({ useCache: false });

  const checks = [
    {
      name: 'VIN extracted',
      pass: result.vin === 'JTNBB46K0C5012345',
    },
    {
      name: 'Manufacturer mapped to Toyota',
      pass: result.manufacturer === 'toyota',
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 4: Unknown VIN prefix handling
export async function testUnknownVINHandling() {
  console.log('\n--- Test: Unknown VIN Prefix Handling ---');
  
  const unknownVIN = 'GE2S643452G906976';  // GE prefix not in our mapping (but valid VIN chars)
  
  const mockConnection = new MockSerialConnection({
    vin: unknownVIN,
    calibrationId: 'XX0000000',
    ecuName: 'UNKNOWN_ECU',
    hwSwVersion: '1.0,1.0',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();

  const result = await ecuDetectionService.detect({ useCache: false });

  const checks = [
    {
      name: 'Status is success (with fallback)',
      pass: result.status === 'success',
    },
    {
      name: 'VIN extracted',
      pass: result.vin === unknownVIN,
    },
    {
      name: 'Manufacturer is null for unknown prefix',
      pass: result.manufacturer === null,
    },
    {
      name: 'Fallback PID file loaded',
      pass: result.pidMetadata !== null,
    },
    {
      name: 'Supported modes included in response',
      pass: result.supportedModes && result.supportedModes.length > 0,
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 5: Cache behavior
export async function testCacheBehavior() {
  console.log('\n--- Test: Cache Behavior ---');
  
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();
  mockConnection.resetHistory();

  // First detection - populates cache
  const result1 = await ecuDetectionService.detect({ useCache: true });
  const commands1 = mockConnection.getCommandHistory().length;

  // Reset command history
  mockConnection.resetHistory();

  // Second detection with cache - should return cached result
  const result2 = await ecuDetectionService.detect({ useCache: true });
  const commands2 = mockConnection.getCommandHistory().length;

  // Third detection without cache - should send commands again
  mockConnection.resetHistory();
  const result3 = await ecuDetectionService.detect({ useCache: false });
  const commands3 = mockConnection.getCommandHistory().length;

  const checks = [
    {
      name: 'First detection sends commands',
      pass: commands1 > 0,
    },
    {
      name: 'Second detection uses cache (no commands)',
      pass: commands2 === 0,
    },
    {
      name: 'Third detection (no cache) sends commands again',
      pass: commands3 > 0,
    },
    {
      name: 'All results have same VIN',
      pass: result1.vin === result2.vin && result2.vin === result3.vin,
    },
    {
      name: 'All results are identical',
      pass: JSON.stringify(result1) === JSON.stringify(result2),
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 6: Command sequence verification
export async function testCommandSequence() {
  console.log('\n--- Test: Command Sequence Verification ---');
  
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  ecuDetectionService.clearCache();
  mockConnection.resetHistory();

  await ecuDetectionService.detect({ useCache: false });

  const history = mockConnection.getCommandHistory();
  const expectedSequence = [
    'ATZ',      // Initialize
    'ATE0',     // Echo off
    'ATL0',     // Linefeeds off
    'ATS0',     // Spaces off
    'ATSP0',    // Protocol detection
    'ATDP',     // Get protocol
    '0902',     // VIN
    '0904',     // Calibration ID
    '0906',     // ECU Name
    '0909',     // HW/SW Version
    '22F18C',   // UDS VIN fallback
    '22F18E',   // UDS Calibration ID fallback
    '22F186',   // UDS ECU Name fallback
    '22F18D',   // UDS HW/SW Version fallback
  ];

  const checks = [
    {
      name: 'Correct number of commands sent',
      pass: history.length === expectedSequence.length,
    },
    {
      name: 'Commands in expected order',
      pass: JSON.stringify(history) === JSON.stringify(expectedSequence),
    },
  ];

  if (history.length !== expectedSequence.length) {
    console.log(`  Expected ${expectedSequence.length} commands, got ${history.length}`);
    console.log(`  Actual: ${history.join(' → ')}`);
    console.log(`  Expected: ${expectedSequence.join(' → ')}`);
  }

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Test Case 7: Clear cache functionality
export async function testClearCache() {
  console.log('\n--- Test: Clear Cache Functionality ---');
  
  ecuDetectionService.clearCache();
  
  // Populate cache
  const mockConnection = new MockSerialConnection({
    vin: 'WBADT43452G906976',
    calibrationId: 'CA0123456',
    ecuName: 'DME_CONTROL_UNIT',
    hwSwVersion: '7.4,11.2',
  });

  ecuDetectionService.setSerialConnection(mockConnection);
  await ecuDetectionService.detect({ useCache: true });

  const cached1 = ecuDetectionService.getCachedDetection();

  // Clear cache
  ecuDetectionService.clearCache();

  const cached2 = ecuDetectionService.getCachedDetection();

  const checks = [
    {
      name: 'Cache populated after detection',
      pass: cached1 !== null && cached1.vin === 'WBADT43452G906976',
    },
    {
      name: 'Cache cleared successfully',
      pass: cached2 === null,
    },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (check.pass) passed++;
  }

  return passed === checks.length;
}

// Run all tests
export async function runAllIntegrationTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ECU Detection Integration Tests    ║');
  console.log('╚════════════════════════════════════════╝');

  const tests = [
    { name: 'BMW VIN Detection', fn: testBMWVINDetection },
    { name: 'Hyundai Detection', fn: testHyundaiDetection },
    { name: 'Toyota Detection', fn: testToyotaDetection },
    { name: 'Unknown VIN Handling', fn: testUnknownVINHandling },
    { name: 'Cache Behavior', fn: testCacheBehavior },
    { name: 'Command Sequence', fn: testCommandSequence },
    { name: 'Clear Cache', fn: testClearCache },
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
  console.log('║         Test Summary                   ║');
  console.log('╚════════════════════════════════════════╝');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  for (const { name, passed: testPassed } of results) {
    const icon = testPassed ? '✓' : '✗';
    console.log(`${icon} ${name}`);
  }

  console.log(`\nResults: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All integration tests passed!');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
  }

  return passed === total;
}

// Run tests if this is the main module
const isMainModule = process.argv[1]?.endsWith('integration.test.js');
if (isMainModule) {
  runAllIntegrationTests().catch(console.error);
}
