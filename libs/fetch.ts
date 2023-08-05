import axios from 'axios';

export function fetch(url: string) {
    return axios.get(url).then((response) => `"${response.data}"`);
}
