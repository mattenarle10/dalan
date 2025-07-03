from mangum import Mangum
from main import app

# Lambda handler
handler = Mangum(app, lifespan="off")

# For AWS Lambda, we need to handle the event and context
def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    return handler(event, context) 