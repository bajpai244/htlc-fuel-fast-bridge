import { LPClient } from './lib/lp_client';

const LP_CLIENT_URL = 'http://localhost:3000/'; // Adjust this if your lp-client is running on a different port

async function main() {
  const lpClient = new LPClient(LP_CLIENT_URL);

  try {
    console.log('Connecting to lp-client...');

    console.log('Creating a new job...');
    const jobId = await lpClient.createJob();

    console.log('Querying the created job...');
    const jobData = await lpClient.queryJob(jobId);

    console.log('Job data:', jobData);
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();
