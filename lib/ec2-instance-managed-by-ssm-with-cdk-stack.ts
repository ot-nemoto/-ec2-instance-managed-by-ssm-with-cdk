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
        // NATを配置するためのパブリックサブネット
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        // エンドポイントを配置するためのプライベートサブネット
        // NATが有効な場合はエンドポイント不要ため、このサブネットはなくてもいい
        {
          cidrMask: 24,
          name: 'private-isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'private-with-egress-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
    });
    // NATが有効な場合はエンドポイント不要
    // vpc.addInterfaceEndpoint('ssm', {
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM,
    //   subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    // });
    // vpc.addInterfaceEndpoint('ssmmessages', {
    //   service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    //   subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    // });
    // vpc.addInterfaceEndpoint('ec2messages', {
    //   service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    //   subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    // });

    // EC2 インスタンスの作成
    new ec2.Instance(this, 'instance', {
      instanceName: 'ec2-instance-managed-by-ssm-with-cdk',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
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
