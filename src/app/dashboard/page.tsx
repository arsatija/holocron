import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Breadcrumb, BreadcrumbList, BreadcrumbPage, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb";

export default function Dashboard() {
  return (
    <div>
      {/* <Breadcrumb className="p-4">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb> */}
      <div className="p-4">
        <Card className="rounded-xl shadow-md grid space-y-2 md:grid-cols-2 lg:grid-cols-3 lg:space-y-0">
          <div className=" hover:bg-muted border border-s-transparent border-y-transparent">
            <CardHeader className="p-4">
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p>Section 1</p>
            </CardContent>
          </div>
          <div className=" hover:bg-muted border border-s-transparent border-y-transparent">
            <CardHeader className="p-4">
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p>Section 1</p>
            </CardContent>
          </div>
          <div className=" hover:bg-muted border border-transparent">
            <CardHeader className="p-4">
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p>Section 1</p>
            </CardContent>
          </div>
        </Card>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </div>
  );
}
