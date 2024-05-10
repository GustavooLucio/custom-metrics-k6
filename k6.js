import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

let fullLoad = new Rate('full_load');
let partialLoadTwoThirds = new Rate('partial_load_two_thirds');
let partialLoadOneThird = new Rate('partial_load_one_third');

export let options = {
  stages: [
    { duration: '10s', target: 10 }, 
    { duration: '10s', target: 5 }, 
    { duration: '20s', target: 0 },  
  ],
  thresholds: {
    'full_load': ['rate>=0.50'], // 50% of all requests must be full_load
  }
};

export default function () {
  const res = http.get('http://bookinfo.com/productpage');
  const results = {
    'product reviews error absent': !res.body.includes('Error fetching product reviews!'),
    'product details error absent': !res.body.includes('Error fetching product details!'),
    'ratings service error absent': !res.body.includes('Ratings service is currently unavailable')
  };
  // get the number of checks that passed 
  let successfulComponents = Object.values(results).filter(val => val).length;
  fullLoad.add(successfulComponents === 3 ? 1 : 0);
  partialLoadTwoThirds.add(successfulComponents === 2 ? 1 : 0);
  partialLoadOneThird.add(successfulComponents === 1 ? 1 : 0);

  sleep(1); 
}
