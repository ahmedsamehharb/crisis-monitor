import axios from 'axios';

const mobidataClient = async () => {
    if (!process.env.MOBIDATA_API_URL) {
        throw new Error('MOBIDATA_API_URL environment variable is not set');
    }
    const url = process.env.MOBIDATA_API_URL as string;
    const response = await axios.get(url);
    return response.data;
};

export default mobidataClient;
