# ec2-instance-managed-by-ssm-with-cdk

- SSM で管理するプライベートネットワークのインスタンスを作成する

## デプロイ

### 事前準備

```sh
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_DEFAULT_REGION=
```

### インフラストラクチャの作成

```sh
npm run cdk deploy
```

### インフラストラクチャの削除

```sh
npm run cdk destroy
```
