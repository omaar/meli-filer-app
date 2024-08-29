# meli-filer-app

## Cómo usar

### Desarrollo

1. Crea una copia del archivo `.env.example`:

   ```bash
   cp .env.example .env.dev
   ```

2. Configura las variables de entorno en `.env.dev`:

   ```plaintext
   VITE_PORT=
   VITE_API_URL=
   VITE_RECAPTCHA_SITE_KEY=
   ```

3. Ejecuta el entorno de desarrollo. El proyecto utiliza el paquete `dotenv` para cargar las variables desde el archivo `.env.dev`:

   ```bash
   npm run dev
   ```

### Producción

1. Crea una copia del archivo `.env.example`:

   ```bash
   cp .env.example .env.production
   ```

   ⚠️ **Nota**: Los valores dentro del archivo `.env.production` deben ir sin dobles comillas `""`.

   Ejemplo:

   ```plaintext
   VITE_RECAPTCHA_SITE_KEY=a221bfgf
   ```

2. Compila la imagen de Docker:

   ```bash
   npm run build-docker
   ```

3. Ejecuta el contenedor de Docker:

   - Comando por defecto:

     ```bash
     npm run docker
     ```

   - Comando personalizado:

     ```bash
     docker run -d -p [HTTP_PORT]:80 --name meli-filer-app iomaar/meli-filer-app
     ```
