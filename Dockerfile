# Etapa 1: Construcción de la aplicación
FROM node:18.17.1 as build

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos de la aplicación al contenedor
COPY . .

# Instala las dependencias de la aplicación
RUN npm install

# Establece el entorno de producción y compila la aplicación
ARG NODE_ENV=production
RUN npm run build

# Etapa 2: Servir la aplicación
FROM nginx:alpine

# Copia los archivos compilados desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copia el archivo de configuración de Nginx
#COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 para acceder a la aplicación
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

