import sys
sys.path.append('.')
from main import app
print('App created')
from irrigation_logic import irrigation_decision
result = irrigation_decision(30.0, False)
print('Decision result:', result)