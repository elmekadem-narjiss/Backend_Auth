const autocannon = require('autocannon');

async function runPerformanceTests() {
  const urls = ['http://localhost:5000/', 'http://localhost:5000/api/tasks'];

  for (const url of urls) {
    console.log(`Running performance test for ${url}`);
    const result = await autocannon({
      url: url,
      connections: 50,
      duration: 10
    });

    console.log(autocannon.printResult(result));

    const avgLatency = result.latency.average;
    const errorRate = (result.errors / result.requests.total) * 100;

    if (avgLatency > 500) {
      console.error(`Average latency (${avgLatency}ms) exceeds threshold of 500ms for ${url}`);
      process.exit(1);
    }

    if (errorRate > 1) {
      console.error(`Error rate (${errorRate}%) exceeds threshold of 1% for ${url}`);
      process.exit(1);
    }

    console.log(`Performance test passed for ${url}`);
  }
}

runPerformanceTests().catch(err => {
  console.error('Performance test failed:', err);
  process.exit(1);
});