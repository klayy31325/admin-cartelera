const publicRoutes = require('./routes/public.routes');
// Mocking req/res
const req = { query: { maquina_id: '1' } };
const res = {
  json: (data) => console.log('SUCCESS:', JSON.stringify(data, null, 2)),
  status: (code) => ({
    json: (data) => console.log('ERROR:', code, JSON.stringify(data, null, 2))
  })
};

// We need to bypass the actual express app and just call the controller logic if possible
// But public.routes.js defines routes, not the controller.
// Let's look at public.routes.js to see what it calls.
