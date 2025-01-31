import axios from "axios"

function dl(url) {
  return new Promise((resolve, reject) => {
    axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`)
      .then(({ data }) => {
        resolve(data)
      })
      .catch(e => {
        reject(e)
      })
  })
}

export default dl;