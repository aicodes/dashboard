import sys

classNames = {}
for i in sys.stdin:
    names = i.split('.')[:-1]  # throw away method names
    className = '.'.join(names)
    if className not in classNames:
        classNames[className] = True
for className in classNames:
    print '\'' + className + '\','
