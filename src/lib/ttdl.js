import axios from "axios"

function dl(url) {
  return new Promise((resolve, reject) => {
    axios.post(`https://www.tikwm.com/api/`, { url, hd: 1 })
      .then(({ data }) => {
        resolve(data)
      })
      .catch(e => {
        reject(e)
      })
  })
}

export default dl;