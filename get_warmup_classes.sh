head -n 600 vocab.txt | awk '{print $1}' |grep java | sort  > temp
cat temp | python process_warmup_classes.py | sort
rm temp
