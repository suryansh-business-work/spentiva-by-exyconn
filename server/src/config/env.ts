export default {
  PORT: process.env.PORT || 8002,
  DBURL:
    process.env.DBURL ||
    'mongodb+srv://suryanshbusinesswork:education54@sibera-box.ofemtir.mongodb.net/sibera-restart?retryWrites=true&w=majority',
  SERVICES: {
    EMAIL: {
      POSTMASK: process.env.POSTMASK || '4f990416-098b-4ae3-b96f-48aa5ce47504'
    }
  }
};
