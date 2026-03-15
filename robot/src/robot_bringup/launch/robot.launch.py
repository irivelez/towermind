from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import ExecuteProcess


def generate_launch_description():
    return LaunchDescription([

        # Camera 1 - /dev/video0
        Node(
            package='v4l2_camera',
            executable='v4l2_camera_node',
            name='camera_front',
            namespace='camera_front',
            parameters=[{
                'video_device': '/dev/video0',
                'image_size': [640, 480],
                'camera_frame_id': 'camera_front_link',
            }],
        ),

        # Camera 2 - /dev/video4
        Node(
            package='v4l2_camera',
            executable='v4l2_camera_node',
            name='camera_back',
            namespace='camera_back',
            parameters=[{
                'video_device': '/dev/video4',
                'image_size': [640, 480],
                'camera_frame_id': 'camera_back_link',
            }],
        ),

        # Servo controller (4 servos via PCA9685, channels 4-7)
        Node(
            package='servo_controller',
            executable='servo_node',
            name='servo_controller',
        ),

        # Wheel controller (3 continuous rotation servos, channels 0-2)
        Node(
            package='wheel_controller',
            executable='wheel_node',
            name='wheel_controller',
        ),


    ])
