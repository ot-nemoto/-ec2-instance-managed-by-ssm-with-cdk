import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class Ec2InstanceManagedBySsmWithCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC の作成
    const vpc = new ec2.Vpc(this, 'main', {
      maxAzs: 2, // 可用性ゾーンの最大数
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // VPC の CIDR ブロック
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 0, // NAT ゲートウェイの数を 0 に設定
    });
    vpc.addInterfaceEndpoint('ssm', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });
    vpc.addInterfaceEndpoint('ssmmessages', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    });
    vpc.addInterfaceEndpoint('ec2messages', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    });

    // EC2 インスタンスの作成
    new ec2.Instance(this, 'instance', {
      instanceName: 'ec2-instance-managed-by-ssm-with-cdk',
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role: new iam.Role(this, 'role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'AmazonSSMManagedInstanceCore',
            'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
          ),
        ],
      }),
    });
  }
}
