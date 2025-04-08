import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "@/components/ui/code"

export default function FixConnectDependencies() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Fix Connect RPC Dependencies</CardTitle>
        <CardDescription>Resolve the missing protoBase64 export error</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Option 1: Update both packages to compatible versions</h3>
          <p className="mb-2">Run the following command to update both packages to compatible versions:</p>
          <Code className="mb-4">npm install @bufbuild/protobuf@1.4.0 @connectrpc/connect@1.1.0</Code>
          <p className="text-sm text-muted-foreground">This ensures you have versions that work together correctly.</p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Option 2: Update just the Protobuf package</h3>
          <p className="mb-2">
            If you need to keep your current Connect version, install a compatible Protobuf version:
          </p>
          <Code className="mb-4">npm install @bufbuild/protobuf@^1.3.0</Code>
          <p className="text-sm text-muted-foreground">
            The protoBase64 export was added in version 1.3.0 of @bufbuild/protobuf.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-sm">After updating the packages, restart your development server:</p>
        <Code>npm run dev</Code>
      </CardFooter>
    </Card>
  )
}

