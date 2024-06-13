FROM docker.io/nginx:stable-alpine
COPY site/* /usr/share/nginx/html/
# RUN echo "server {" > /etc/nginx/conf.d/default.conf && \
#     echo "    listen 80;" >> /etc/nginx/conf.d/default.conf && \
#     echo "    location / {" >> /etc/nginx/conf.d/default.conf && \
#     echo "        root /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf && \
#     echo "        index index.html index.htm;" >> /etc/nginx/conf.d/default.conf && \
#     echo "        try_files \$uri \$uri/ /index.html =404;" >> /etc/nginx/conf.d/default.conf && \
#     echo "    }" >> /etc/nginx/conf.d/default.conf && \
#     echo "}" >> /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
