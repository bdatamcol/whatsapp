import { testConnection } from './src/app/api/mongo/mongodb';

testConnection()
  .then(result => {
    console.log('Result:', result);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });