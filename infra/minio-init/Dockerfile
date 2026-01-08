FROM quay.io/minio/mc:latest
CMD ["/bin/sh","-c","sleep 5; mc alias set local http://srv-captain--minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD; mc mb --ignore-existing local/media; mc anonymous set download local/media; echo DONE; sleep 2"]
