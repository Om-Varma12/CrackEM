import numpy as np

def getQ():
    totalQ = np.random.randint(5, 10)
    firstHalfQ = np.random.randint(1, totalQ -1)
    return totalQ, firstHalfQ