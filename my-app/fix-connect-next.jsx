import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FixConnectNextJs() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Fix Connect RPC in Next.js</CardTitle>
        <CardDescription>Comprehensive solution for the missing protoBase64 export in a Next.js app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="package">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="package">Update Packages</TabsTrigger>
            <TabsTrigger value="transpile">Configure Transpilation</TabsTrigger>
            <TabsTrigger value="patch">Patch Module</TabsTrigger>
          </TabsList>

          <TabsContent value="package" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 1: Update packages</h3>
              <p className="mb-2">Install compatible versions of both packages:</p>
              <Code className="mb-4">npm install @bufbuild/protobuf@^1.3.0 @connectrpc/connect@^1.1.0</Code>
              <p className="text-sm text-muted-foreground">Make sure to clear your Next.js cache after updating:</p>
              <Code className="mb-2">rm -rf .next</Code>
            </div>
          </TabsContent>

          <TabsContent value="transpile" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 2: Configure Next.js to transpile the modules</h3>
              <p className="mb-2">Update your next.config.js to transpile the Connect RPC modules:</p>
              <Code className="mb-4">
                {`// next.config.js
const nextConfig = {
  transpilePackages: [
    '@bufbuild/protobuf',
    '@connectrpc/connect',
    '@connectrpc/connect-web'
  ],
  // ...other config
};

module.exports = nextConfig;`}
              </Code>
              <p className="text-sm text-muted-foreground">
                This ensures Next.js properly processes these modules instead of using the pre-compiled versions.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="patch" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 3: Create a patch for the module (if needed)</h3>
              <p className="mb-2">If the above steps don't work, you can create a patch file:</p>
              <Code className="mb-4">
                {`// patches/@connectrpc+connect+1.1.0.patch
diff --git a/node_modules/@connectrpc/connect/dist/esm/protocol-connect/get-request.js b/node_modules/@connectrpc/connect/dist/esm/protocol-connect/get-request.js
index abcdef1..1234567 100644
--- a/node_modules/@connectrpc/connect/dist/esm/protocol-connect/get-request.js
+++ b/node_modules/@connectrpc/connect/dist/esm/protocol-connect/get-request.js
@@ -11,7 +11,7 @@
 // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 // See the License for the specific language governing permissions and
 // limitations under the License.
-import { Message, protoBase64 } from "@bufbuild/protobuf";
+import { Message } from "@bufbuild/protobuf";
 import { headerContentType, headerProtocolVersion, headerUnaryAcceptEncoding, headerUnaryContentLength, headerUnaryEncoding, } from "./headers.js";
 import { protocolVersion } from "./version.js";
-const contentTypePrefix = "application/";`}
              </Code>
              <p className="mb-2">Install patch-package to apply the patch:</p>
              <Code className="mb-2">npm install patch-package --save-dev</Code>
              <p className="mb-2">Add this to your package.json scripts:</p>
              <Code className="mb-2">
                {`"scripts": {
  "postinstall": "patch-package"
}`}
              </Code>
              <p className="text-sm text-muted-foreground">
                This is a temporary solution until the packages are updated.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-sm font-medium">Alternative solution: Use a custom implementation</p>
        <p className="text-sm text-muted-foreground">
          If you're using Connect RPC with Next.js App Router, consider using tRPC or GraphQL instead, which have better
          Next.js integration.
        </p>
        <Button variant="outline" className="mt-2">
          Restart your development server
        </Button>
      </CardFooter>
    </Card>
  )
}

