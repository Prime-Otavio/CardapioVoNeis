// Foto de celular tem ~4 MB. Reduz para 900px no maior lado, JPEG 0.82,
// antes de subir — senão o upload trava na 4G da loja.
export function encolherImagem(arquivo, max = 900, qualidade = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(arquivo)
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height))
      const cv = document.createElement('canvas')
      cv.width = Math.round(img.width * escala)
      cv.height = Math.round(img.height * escala)
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
      cv.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (!blob) return reject(new Error('Não consegui processar a imagem.'))
        resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', qualidade)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Arquivo não é uma imagem válida.'))
    }
    img.src = url
  })
}
