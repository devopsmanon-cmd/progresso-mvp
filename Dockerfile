FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers de l'app
COPY . /usr/share/nginx/html

EXPOSE 80