"""
YOLO Processing Lambda Function for async image processing
Handles SQS messages for background YOLO model processing
"""
import json
import logging
import boto3
from typing import Dict, Any
from services.detection import classify_image
from database.operations import create_crack_detection, create_detection_summary
from config import logger

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing YOLO detection jobs from SQS
    
    Args:
        event: SQS event containing detection job messages
        context: Lambda execution context
        
    Returns:
        Dict with processing results
    """
    try:
        processed_count = 0
        failed_count = 0
        
        # Process each SQS message
        for record in event.get('Records', []):
            try:
                # Parse message body
                message_body = json.loads(record['body'])
                entry_id = message_body['entry_id']
                image_url = message_body['image_url']
                user_id = message_body['user_id']
                
                logger.info(f"Processing YOLO job for entry {entry_id}")
                
                # Download and process image
                # Note: You might need to download the image from S3 first
                # For now, assuming classify_image can handle URLs
                detection_result = classify_image(image_url, user_id)
                
                if detection_result:
                    # Save detection results to database
                    for detection in detection_result.get('detections', []):
                        detection_data = {
                            'road_crack_id': entry_id,
                            'x1': detection['x1'],
                            'y1': detection['y1'],
                            'x2': detection['x2'],
                            'y2': detection['y2'],
                            'confidence': detection['confidence'],
                            'class_id': detection['class_id'],
                            'label': detection['label']
                        }
                        create_crack_detection(detection_data)
                    
                    # Create detection summary
                    summary_data = {
                        'road_crack_id': entry_id,
                        'total_cracks': detection_result['total_cracks'],
                        'crack_types': detection_result['crack_types']
                    }
                    create_detection_summary(summary_data)
                    
                    logger.info(f"Successfully processed entry {entry_id}")
                    processed_count += 1
                else:
                    logger.error(f"Failed to process entry {entry_id}")
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing SQS record: {e}")
                failed_count += 1
                
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {processed_count} jobs, failed {failed_count} jobs'
            })
        }
        
    except Exception as e:
        logger.error(f"Error in YOLO processor handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
